export type SuggestedSkillCategory = "it" | "soft" | "industry" | "healthcare"

export type SuggestedSkill = {
  key: string
  /** Canonical English name stored as skill_name */
  value: string
  category: SuggestedSkillCategory
}

export const SUGGESTED_SKILL_CATEGORIES: SuggestedSkillCategory[] = [
  "it",
  "soft",
  "industry",
  "healthcare",
]

export const SUGGESTED_SKILLS: SuggestedSkill[] = [
  // IT & Digital
  { key: "react", value: "React", category: "it" },
  { key: "nextjs", value: "Next.js", category: "it" },
  { key: "typescript", value: "TypeScript", category: "it" },
  { key: "javascript", value: "JavaScript", category: "it" },
  { key: "html", value: "HTML", category: "it" },
  { key: "css", value: "CSS", category: "it" },
  { key: "tailwind", value: "Tailwind CSS", category: "it" },
  { key: "nodejs", value: "Node.js", category: "it" },
  { key: "python", value: "Python", category: "it" },
  { key: "php", value: "PHP", category: "it" },
  { key: "sql", value: "SQL", category: "it" },
  { key: "git", value: "Git", category: "it" },
  { key: "docker", value: "Docker", category: "it" },
  { key: "graphql", value: "GraphQL", category: "it" },
  { key: "restApi", value: "REST API", category: "it" },
  { key: "figma", value: "Figma", category: "it" },
  { key: "wordpress", value: "WordPress", category: "it" },
  { key: "uiux", value: "UI/UX Design", category: "it" },
  { key: "laravel", value: "Laravel", category: "it" },
  { key: "angular", value: "Angular", category: "it" },
  { key: "vuejs", value: "Vue.js", category: "it" },

  // Soft Skills
  { key: "teamwork", value: "Teamwork", category: "soft" },
  { key: "communication", value: "Communication", category: "soft" },
  { key: "responsibility", value: "Sense of Responsibility", category: "soft" },
  { key: "reliability", value: "Reliability", category: "soft" },
  { key: "flexibility", value: "Flexibility", category: "soft" },
  { key: "willingnessToLearn", value: "Willingness to Learn", category: "soft" },
  { key: "independentWorking", value: "Independent Working", category: "soft" },
  { key: "problemSolving", value: "Problem Solving", category: "soft" },
  { key: "resilience", value: "Resilience", category: "soft" },
  { key: "organizationalSkills", value: "Organizational Skills", category: "soft" },
  { key: "customerOrientation", value: "Customer Orientation", category: "soft" },
  { key: "leadershipExperience", value: "Leadership Experience", category: "soft" },

  // Technical Skills (Industry)
  { key: "machineOperation", value: "Machine Operation", category: "industry" },
  { key: "cnc", value: "CNC", category: "industry" },
  { key: "plcProgramming", value: "PLC Programming", category: "industry" },
  { key: "electricalEngineering", value: "Electrical Engineering", category: "industry" },
  { key: "mechatronics", value: "Mechatronics", category: "industry" },
  { key: "welding", value: "Welding", category: "industry" },
  { key: "hydraulics", value: "Hydraulics", category: "industry" },
  { key: "pneumatics", value: "Pneumatics", category: "industry" },
  { key: "qualityControl", value: "Quality Control", category: "industry" },
  { key: "maintenance", value: "Maintenance & Servicing", category: "industry" },
  { key: "cadDesign", value: "CAD Design", category: "industry" },
  { key: "robotics", value: "Robotics", category: "industry" },
  { key: "automationTechnology", value: "Automation Technology", category: "industry" },

  // Care & Healthcare
  { key: "basicCare", value: "Basic Care", category: "healthcare" },
  { key: "treatmentCare", value: "Treatment Care", category: "healthcare" },
  { key: "intensiveCare", value: "Intensive Care", category: "healthcare" },
  { key: "operatingRoomExperience", value: "Operating Room Experience", category: "healthcare" },
  { key: "elderlyCare", value: "Elderly Care", category: "healthcare" },
  { key: "emergencyCare", value: "Emergency Care", category: "healthcare" },
  { key: "woundManagement", value: "Wound Management", category: "healthcare" },
  { key: "medicationAdministration", value: "Medication Administration", category: "healthcare" },
  { key: "documentation", value: "Documentation", category: "healthcare" },
  { key: "hygieneRegulations", value: "Hygiene Regulations", category: "healthcare" },
  { key: "patientCare", value: "Patient Care", category: "healthcare" },
]

export function findSuggestedSkill(skillName: string): SuggestedSkill | undefined {
  const needle = skillName.trim().toLowerCase()
  return SUGGESTED_SKILLS.find((s) => s.value.toLowerCase() === needle || s.key.toLowerCase() === needle)
}
