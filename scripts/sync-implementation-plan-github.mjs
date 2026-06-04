#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const priorityProjectNames = {
  Critical: "P0",
  High: "P1",
  Medium: "P2",
  Low: "P3",
};

const statusProjectNames = {
  Backlog: "Backlog",
  Ready: "Ready",
  "In Progress": "In progress",
  "Needs Review": "In review",
  Done: "Done",
};

const usage = `Usage:
  node scripts/sync-implementation-plan-github.mjs --dry-run [--task T015E]
  node scripts/sync-implementation-plan-github.mjs --verify [--verify-body]
  node scripts/sync-implementation-plan-github.mjs --apply [--task T015E]

Options:
  --plan <path>             Implementation plan path. Default: IMPLEMENTATION_PLAN.md
  --repo <owner/repo>       GitHub repository. Default: Gyu-bot/deck_storyboard
  --project-owner <owner>   GitHub Project owner. Default: repo owner
  --project-number <n>      GitHub Project number. Default: 1
  --task <id>               Limit to a task id. Can be repeated.
  --issue <number>          Limit to an issue number. Can be repeated.
  --dry-run                 Parse and show intended changes without writing.
  --verify                  Verify generated body safety and Project fields.
  --verify-body             With --verify, also compare remote issue title/body.
  --apply                   Update issue title/body and Project Status/Priority.
`;

function parseArgs(argv) {
  const args = {
    plan: "IMPLEMENTATION_PLAN.md",
    repo: "Gyu-bot/deck_storyboard",
    projectOwner: null,
    projectNumber: "1",
    taskIds: new Set(),
    issues: new Set(),
    dryRun: false,
    verify: false,
    verifyBody: false,
    apply: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) {
        throw new Error(`Missing value for ${arg}`);
      }
      return argv[index];
    };

    if (arg === "--plan") args.plan = next();
    else if (arg === "--repo") args.repo = next();
    else if (arg === "--project-owner") args.projectOwner = next();
    else if (arg === "--project-number") args.projectNumber = next();
    else if (arg === "--task") args.taskIds.add(next());
    else if (arg === "--issue") args.issues.add(Number(next()));
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--verify") args.verify = true;
    else if (arg === "--verify-body") args.verifyBody = true;
    else if (arg === "--apply") args.apply = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(usage);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  const modeCount = [args.dryRun, args.verify, args.apply].filter(Boolean).length;
  if (modeCount !== 1) {
    throw new Error("Choose exactly one mode: --dry-run, --verify, or --apply.");
  }
  if (args.verifyBody && !args.verify) {
    throw new Error("--verify-body requires --verify.");
  }
  if (!args.projectOwner) {
    args.projectOwner = args.repo.split("/")[0];
  }
  return args;
}

function gh(args, options = {}) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
  });
}

function parseTopLevelField(block, fieldName) {
  return block.match(new RegExp(`^- ${escapeRegExp(fieldName)}: ?(.*)$`, "m"))?.[1]?.trim() ?? null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseIndentedList(block, fieldName) {
  const lines = block.split("\n");
  const startIndex = lines.findIndex((line) => line === `- ${fieldName}:`);
  if (startIndex < 0) return [];

  const result = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^- [A-Z][^:]+:/.test(line)) break;
    if (line.startsWith("  - ")) {
      result.push(line.slice(2));
    } else if (line.trim() === "") {
      continue;
    } else if (line.startsWith("    ")) {
      const previous = result.pop() ?? "";
      result.push(`${previous}\n${line.slice(2)}`);
    } else {
      break;
    }
  }
  return result;
}

function parsePlan(planText) {
  const headers = [...planText.matchAll(/^#### Task ([A-Za-z0-9]+)\. (.+)$/gm)];
  const tasks = headers.map((match, index) => {
    const start = match.index;
    const end = headers[index + 1]?.index ?? planText.length;
    const block = planText.slice(start, end).trimEnd();
    const issueValue = parseTopLevelField(block, "Issue");
    const issueMatch = issueValue?.match(/^#(\d+)$/);
    const dependsOn = parseTopLevelField(block, "Depends on") ?? "None";
    return {
      id: match[1],
      title: match[2].trim(),
      priority: parseTopLevelField(block, "Priority"),
      status: parseTopLevelField(block, "Status"),
      issue: issueMatch ? Number(issueMatch[1]) : null,
      issueValue,
      pr: parseTopLevelField(block, "PR"),
      dependsOn,
      dependencies: dependsOn
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value && value !== "None" && !value.includes("Merged PR")),
      branch: parseTopLevelField(block, "Branch"),
      expectedPrUnit: parseTopLevelField(block, "Expected PR Unit"),
      acceptanceCriteria: parseIndentedList(block, "Acceptance Criteria"),
      notes: parseIndentedList(block, "Notes"),
      block,
    };
  });
  return tasks;
}

function taskIssueTitle(task) {
  return `${task.id}. ${task.title}`;
}

function formatTaskValue(value) {
  if (!value || value === "None") return "None";
  return value;
}

function dependencyRelationships(task, tasksById) {
  if (task.dependencies.length === 0) return ["- None"];
  return task.dependencies.map((dependencyId) => {
    const dependency = tasksById.get(dependencyId);
    if (!dependency) return `- ${dependencyId}: Missing from IMPLEMENTATION_PLAN.md`;
    return `- ${dependency.id}: ${dependency.issue ? `#${dependency.issue}` : dependency.status}`;
  });
}

function buildIssueBody(task, tasksById) {
  const priorityProject = priorityProjectNames[task.priority] ?? "Unmapped";
  const acceptanceCriteria =
    task.acceptanceCriteria.length > 0 ? task.acceptanceCriteria : ["- None"];
  const notes = task.notes.length > 0 ? task.notes : ["- None"];

  return [
    "<!-- deck-storyboard-plan-sync: generated from IMPLEMENTATION_PLAN.md -->",
    "",
    "## Task",
    "",
    `- Task ID: \`${task.id}\``,
    `- Title: ${task.title}`,
    `- Priority: ${priorityProject} (${formatTaskValue(task.priority)})`,
    `- Status: ${formatTaskValue(task.status)}`,
    `- PR: ${formatTaskValue(task.pr)}`,
    `- Depends on: ${formatTaskValue(task.dependsOn)}`,
    `- Branch: ${formatTaskValue(task.branch)}`,
    `- Expected PR Unit: ${formatTaskValue(task.expectedPrUnit)}`,
    "",
    "## Dependency Relationships",
    "",
    ...dependencyRelationships(task, tasksById),
    "",
    "## Acceptance Criteria",
    "",
    ...acceptanceCriteria,
    "",
    "## Notes",
    "",
    ...notes,
    "",
    "## Sync Policy",
    "",
    "- This issue body is generated as renderable GitHub Markdown.",
    "- Raw `IMPLEMENTATION_PLAN.md` task blocks are intentionally not embedded in fenced code blocks.",
    "- GitHub Project `Status` and `Priority` fields must be synced separately from this issue body.",
    "",
  ].join("\n");
}

function validateTask(task) {
  const errors = [];
  if (!task.priority) errors.push(`${task.id}: missing Priority`);
  if (!task.status) errors.push(`${task.id}: missing Status`);
  if (!task.pr) errors.push(`${task.id}: missing PR`);
  if (!task.dependsOn) errors.push(`${task.id}: missing Depends on`);
  if (!task.branch) errors.push(`${task.id}: missing Branch`);
  if (!task.expectedPrUnit) errors.push(`${task.id}: missing Expected PR Unit`);
  if (task.priority && !priorityProjectNames[task.priority]) {
    errors.push(`${task.id}: unknown Priority ${task.priority}`);
  }
  if (task.status && !statusProjectNames[task.status]) {
    errors.push(`${task.id}: unknown Status ${task.status}`);
  }
  return errors;
}

function validateGeneratedBody(task, body) {
  const errors = [];
  if (body.includes("## Current Plan Section")) {
    errors.push(`${task.id}: generated body contains raw Current Plan Section`);
  }
  if (/^```/m.test(body)) {
    errors.push(`${task.id}: generated body contains fenced code block`);
  }
  return errors;
}

function loadProject(projectOwner, projectNumber) {
  const projects = JSON.parse(
    gh(["project", "list", "--owner", projectOwner, "--format", "json"]),
  ).projects;
  const project = projects.find((candidate) => String(candidate.number) === String(projectNumber));
  if (!project) {
    throw new Error(`Project ${projectOwner}/${projectNumber} not found.`);
  }

  const fields = JSON.parse(
    gh(["project", "field-list", projectNumber, "--owner", projectOwner, "--format", "json"]),
  ).fields;
  const statusField = fields.find((field) => field.name === "Status");
  const priorityField = fields.find((field) => field.name === "Priority");
  if (!statusField || !priorityField) {
    throw new Error("Project fields Status/Priority were not found.");
  }

  const statusOptions = new Map(statusField.options.map((option) => [option.name, option.id]));
  const priorityOptions = new Map(priorityField.options.map((option) => [option.name, option.id]));

  return {
    id: project.id,
    statusFieldId: statusField.id,
    priorityFieldId: priorityField.id,
    statusOptions,
    priorityOptions,
  };
}

function loadProjectItems(projectOwner, projectNumber) {
  const items = JSON.parse(
    gh([
      "project",
      "item-list",
      projectNumber,
      "--owner",
      projectOwner,
      "--limit",
      "200",
      "--format",
      "json",
    ]),
  ).items;
  const byIssue = new Map();
  for (const item of items ?? []) {
    if (typeof item.content?.number === "number") {
      byIssue.set(item.content.number, item);
    }
  }
  return byIssue;
}

function loadProjectFieldValues(projectOwner, projectNumber) {
  const query = `
query($login:String!, $number:Int!) {
  user(login:$login) {
    projectV2(number:$number) {
      items(first:100) {
        nodes {
          id
          content { ... on Issue { number title } }
          fieldValues(first:20) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2SingleSelectField { name } }
              }
            }
          }
        }
      }
    }
  }
}`;
  const nodes = JSON.parse(
    gh(["api", "graphql", "-f", `query=${query}`, "-f", `login=${projectOwner}`, "-F", `number=${projectNumber}`]),
  ).data.user.projectV2.items.nodes;

  const byIssue = new Map();
  for (const node of nodes) {
    const issueNumber = node.content?.number;
    if (typeof issueNumber !== "number") continue;
    const fields = {};
    for (const fieldValue of node.fieldValues.nodes ?? []) {
      const fieldName = fieldValue.field?.name;
      if (fieldName === "Status" || fieldName === "Priority") {
        fields[fieldName] = fieldValue.name;
      }
    }
    byIssue.set(issueNumber, fields);
  }
  return byIssue;
}

function issueView(repo, issueNumber) {
  return JSON.parse(
    gh(["issue", "view", String(issueNumber), "--repo", repo, "--json", "number,title,body,url"]),
  );
}

function issueUrl(repo, issueNumber) {
  return `https://github.com/${repo}/issues/${issueNumber}`;
}

function editSingleSelect(project, itemId, fieldId, optionId) {
  gh([
    "project",
    "item-edit",
    "--project-id",
    project.id,
    "--id",
    itemId,
    "--field-id",
    fieldId,
    "--single-select-option-id",
    optionId,
  ]);
}

function addProjectItem(projectOwner, projectNumber, repo, issueNumber) {
  gh([
    "project",
    "item-add",
    projectNumber,
    "--owner",
    projectOwner,
    "--url",
    issueUrl(repo, issueNumber),
    "--format",
    "json",
  ]);
}

function editIssue(repo, task, body) {
  const tempDir = mkdtempSync(join(tmpdir(), "deck-storyboard-issue-"));
  const bodyFile = join(tempDir, `${task.id}.md`);
  writeFileSync(bodyFile, body);
  gh([
    "issue",
    "edit",
    String(task.issue),
    "--repo",
    repo,
    "--title",
    taskIssueTitle(task),
    "--body-file",
    bodyFile,
  ]);
}

function selectTasks(tasks, args) {
  return tasks.filter((task) => {
    if (!task.issue) return false;
    if (args.taskIds.size > 0 && !args.taskIds.has(task.id)) return false;
    if (args.issues.size > 0 && !args.issues.has(task.issue)) return false;
    return true;
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const plan = await readFile(args.plan, "utf8");
  const allTasks = parsePlan(plan);
  const tasksById = new Map(allTasks.map((task) => [task.id, task]));
  const tasks = selectTasks(allTasks, args);
  const errors = [];

  for (const task of tasks) {
    errors.push(...validateTask(task));
    errors.push(...validateGeneratedBody(task, buildIssueBody(task, tasksById)));
  }

  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }

  if (args.dryRun) {
    console.log(`Dry run tasks: ${tasks.length}`);
    for (const task of tasks) {
      console.log(`#${task.issue} ${taskIssueTitle(task)} -> ${task.status}/${task.priority}`);
      if (tasks.length === 1) {
        console.log("--- generated body ---");
        console.log(buildIssueBody(task, tasksById));
      }
    }
    return;
  }

  const project = loadProject(args.projectOwner, args.projectNumber);
  const projectFieldValues = loadProjectFieldValues(args.projectOwner, Number(args.projectNumber));

  if (args.verify) {
    const mismatches = [];
    for (const task of tasks) {
      const fields = projectFieldValues.get(task.issue);
      const expectedStatus = statusProjectNames[task.status];
      const expectedPriority = priorityProjectNames[task.priority];
      if (!fields) {
        mismatches.push(`#${task.issue} ${task.id}: missing Project item`);
      } else if (fields.Status !== expectedStatus || fields.Priority !== expectedPriority) {
        mismatches.push(
          `#${task.issue} ${task.id}: expected Project ${expectedStatus}/${expectedPriority}, got ${fields.Status}/${fields.Priority}`,
        );
      }

      if (args.verifyBody) {
        const issue = issueView(args.repo, task.issue);
        const expectedTitle = taskIssueTitle(task);
        const expectedBody = buildIssueBody(task, tasksById);
        if (issue.title !== expectedTitle) {
          mismatches.push(`#${task.issue} ${task.id}: title differs`);
        }
        if (issue.body !== expectedBody) {
          mismatches.push(`#${task.issue} ${task.id}: body differs`);
        }
      }
    }

    console.log(`Verified plan-backed issue tasks: ${tasks.length}`);
    console.log(`Mismatches: ${mismatches.length}`);
    for (const mismatch of mismatches) console.log(mismatch);
    if (mismatches.length > 0) process.exit(1);
    return;
  }

  let projectItems = loadProjectItems(args.projectOwner, args.projectNumber);
  for (const task of tasks) {
    const body = buildIssueBody(task, tasksById);
    editIssue(args.repo, task, body);
    if (!projectItems.has(task.issue)) {
      addProjectItem(args.projectOwner, args.projectNumber, args.repo, task.issue);
      projectItems = loadProjectItems(args.projectOwner, args.projectNumber);
    }

    const item = projectItems.get(task.issue);
    const statusOptionId = project.statusOptions.get(statusProjectNames[task.status]);
    const priorityOptionId = project.priorityOptions.get(priorityProjectNames[task.priority]);
    if (!item || !statusOptionId || !priorityOptionId) {
      throw new Error(`Cannot update Project fields for ${task.id} (#${task.issue})`);
    }
    editSingleSelect(project, item.id, project.statusFieldId, statusOptionId);
    editSingleSelect(project, item.id, project.priorityFieldId, priorityOptionId);
    console.log(`Updated #${task.issue} ${task.id}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
