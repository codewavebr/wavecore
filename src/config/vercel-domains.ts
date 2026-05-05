export type WaveDomainResponse = {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: 307 | 301 | 302 | 308 | null;
  gitBranch?: string | null;
  updatedAt?: number;
  createdAt?: number;
  verified: boolean;
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
};

export type WaveDomainConfigResponse = {
  configuredBy?: "CNAME" | "A" | "http" | null;
  acceptedChallenges?: ("dns-01" | "http-01")[];
  misconfigured: boolean;
};

export type WaveDomainVerificationResponse = WaveDomainResponse;

export type VercelDomainClientConfig = {
  projectId: string;
  token: string;
  teamId?: string;
};

function withTeamId(path: string, teamId?: string) {
  return `${path}${teamId ? `?teamId=${teamId}` : ""}`;
}

function getVercelHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function addDomainToVercelProject(
  domain: string,
  config: VercelDomainClientConfig,
) {
  return fetch(
    withTeamId(
      `https://api.vercel.com/v10/projects/${config.projectId}/domains`,
      config.teamId,
    ),
    {
      method: "POST",
      headers: getVercelHeaders(config.token),
      body: JSON.stringify({ name: domain }),
    },
  ).then((response) => response.json());
}

export async function removeDomainFromVercelProject(
  domain: string,
  config: VercelDomainClientConfig,
) {
  return fetch(
    withTeamId(
      `https://api.vercel.com/v9/projects/${config.projectId}/domains/${domain}`,
      config.teamId,
    ),
    {
      method: "DELETE",
      headers: getVercelHeaders(config.token),
    },
  ).then((response) => response.json());
}

export async function removeDomainFromVercelTeam(
  domain: string,
  config: Pick<VercelDomainClientConfig, "token" | "teamId">,
) {
  return fetch(
    withTeamId(`https://api.vercel.com/v6/domains/${domain}`, config.teamId),
    {
      method: "DELETE",
      headers: getVercelHeaders(config.token),
    },
  ).then((response) => response.json());
}

export async function getVercelProjectDomain(
  domain: string,
  config: VercelDomainClientConfig,
): Promise<WaveDomainResponse & { error?: { code: string; message: string } }> {
  return fetch(
    withTeamId(
      `https://api.vercel.com/v9/projects/${config.projectId}/domains/${domain}`,
      config.teamId,
    ),
    {
      method: "GET",
      headers: getVercelHeaders(config.token),
    },
  ).then((response) => response.json());
}

export async function getVercelDomainConfig(
  domain: string,
  config: Pick<VercelDomainClientConfig, "token" | "teamId">,
): Promise<WaveDomainConfigResponse> {
  return fetch(
    withTeamId(
      `https://api.vercel.com/v6/domains/${domain}/config`,
      config.teamId,
    ),
    {
      method: "GET",
      headers: getVercelHeaders(config.token),
    },
  ).then((response) => response.json());
}

export async function verifyVercelProjectDomain(
  domain: string,
  config: VercelDomainClientConfig,
): Promise<WaveDomainVerificationResponse> {
  return fetch(
    withTeamId(
      `https://api.vercel.com/v9/projects/${config.projectId}/domains/${domain}/verify`,
      config.teamId,
    ),
    {
      method: "POST",
      headers: getVercelHeaders(config.token),
    },
  ).then((response) => response.json());
}

export function getSubdomain(name: string, apexName: string) {
  if (name === apexName) return null;
  return name.slice(0, name.length - apexName.length - 1);
}

export function getApexDomain(url: string) {
  let domain;

  try {
    domain = new URL(url).hostname;
  } catch {
    return "";
  }

  const parts = domain.split(".");

  if (parts.length > 2) {
    return parts.slice(-2).join(".");
  }

  return domain;
}

export const validDomainRegex = new RegExp(
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
);
