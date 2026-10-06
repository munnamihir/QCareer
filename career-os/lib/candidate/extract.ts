export type ExtractedCandidate = {
  fullName: string;
  currentTitle: string;
  currentCompany: string;
  seniority: string;
  professionalHeadline: string;
  skills: string[];
  targetRoles: string[];
  achievements: string[];
};

const SKILLS = [
  ".NET",
  ".NET 8",
  "C#",
  "ASP.NET",
  "ASP.NET Core",
  "Angular",
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Python",
  "Java",
  "Go",
  "SQL",
  "PostgreSQL",
  "SQL Server",
  "MySQL",
  "MongoDB",
  "Redis",
  "Azure",
  "AWS",
  "GCP",
  "Docker",
  "Kubernetes",
  "Terraform",
  "GitHub Actions",
  "CI/CD",
  "REST",
  "REST API",
  "REST APIs",
  "GraphQL",
  "EF Core",
  "Entity Framework",
  "Dapper",
  "Microservices",
  "CQRS",
  "RabbitMQ",
  "Kafka",
  "Tailwind",
  "Angular Material",
  "Supabase",
  "Prisma",
  "Git",
  "Linux",
  "HTML",
  "CSS",
  "Accessibility",
  "WCAG",
];

const TITLE_PATTERNS = [
  "Staff Software Engineer",
  "Senior Software Engineer",
  "Sr. Software Engineer",
  "Senior Full Stack Developer",
  "Sr. Full Stack Developer",
  "Full Stack Developer",
  "Full Stack Engineer",
  "Application Developer III",
  "Application Developer",
  "Software Developer",
  "Software Engineer",
  "Backend Engineer",
  "Frontend Engineer",
  "Platform Engineer",
  "Product Engineer",
];

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function firstLikelyName(lines: string[]) {
  for (const line of lines.slice(0, 8)) {
    const text = clean(line);

    if (!text) continue;
    if (text.includes("@")) continue;
    if (text.includes("http")) continue;
    if (/\d{3}[-.)\s]\d{3}/.test(text)) continue;
    if (text.length > 60) continue;

    const words = text.split(" ");

    if (words.length >= 2 && words.length <= 5) {
      return text;
    }
  }

  return "";
}

function detectTitle(text: string) {
  const lower = text.toLowerCase();

  return (
    TITLE_PATTERNS.find((title) =>
      lower.includes(title.toLowerCase()),
    ) ?? ""
  );
}

function detectSeniority(title: string, text: string) {
  const combined = `${title} ${text}`.toLowerCase();

  if (
    combined.includes("principal") ||
    combined.includes("staff engineer")
  ) {
    return "Staff";
  }

  if (
    combined.includes("senior") ||
    combined.includes("sr.")
  ) {
    return "Senior";
  }

  if (
    combined.includes("lead") ||
    combined.includes("architect")
  ) {
    return "Lead";
  }

  return "Mid-Senior";
}

function detectSkills(text: string) {
  const lower = text.toLowerCase();

  const found = SKILLS.filter((skill) => {
    return lower.includes(skill.toLowerCase());
  });

  return [...new Set(found)].slice(0, 25);
}

function extractAchievements(lines: string[]) {
  const candidates = lines
    .map(clean)
    .filter(Boolean)
    .filter((line) => {
      const containsMetric =
        /\d+%|\$\d+|\d+\+|\d{2,}\s*(users|customers|applications|records|requests|systems|services|endpoints|pages|modules)/i.test(
          line,
        );

      const impactVerb =
        /\b(improved|reduced|increased|built|developed|modernized|led|implemented|delivered|optimized|migrated|designed|automated)\b/i.test(
          line,
        );

      return containsMetric && impactVerb;
    });

  return [...new Set(candidates)].slice(0, 3);
}

function inferTargetRoles(
  currentTitle: string,
  skills: string[],
) {
  const result: string[] = [];

  const stack = skills.join(" ").toLowerCase();

  if (
    stack.includes("angular") &&
    (stack.includes(".net") || stack.includes("c#"))
  ) {
    result.push("Senior Full Stack Engineer");
  }

  result.push("Senior Software Engineer");

  if (
    stack.includes("react") ||
    stack.includes("angular") ||
    stack.includes("next.js")
  ) {
    result.push("Full Stack Engineer");
  }

  if (
    stack.includes("api") ||
    stack.includes("sql") ||
    stack.includes("dapper")
  ) {
    result.push("Backend Software Engineer");
  }

  if (
    currentTitle.toLowerCase().includes("application developer")
  ) {
    result.push("Senior Application Developer");
  }

  return [...new Set(result)].slice(0, 4);
}

export function extractCandidateProfile(
  resumeText: string,
): ExtractedCandidate {
  const normalized = resumeText.replace(/\r/g, "");
  const lines = normalized.split("\n");

  const fullName = firstLikelyName(lines);
  const currentTitle = detectTitle(normalized);
  const skills = detectSkills(normalized);
  const seniority = detectSeniority(
    currentTitle,
    normalized,
  );

  const targetRoles = inferTargetRoles(
    currentTitle,
    skills,
  );

  const achievements = extractAchievements(lines);

  const professionalHeadline =
    targetRoles.length > 0
      ? `${seniority} software professional targeting ${targetRoles[0]} opportunities`
      : `${seniority} software professional`;

  return {
    fullName,
    currentTitle,
    currentCompany: "",
    seniority,
    professionalHeadline,
    skills,
    targetRoles,
    achievements,
  };
}
