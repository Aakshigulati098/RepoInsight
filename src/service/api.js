
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      details || `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

// Fetch all saved repositories
export function getRepositories() {
  return request("/api/repositories");
}

// Import a public GitHub repository
export function importRepository(githubUrl) {
  return request("/api/repositories/import", {
    method: "POST",
    body: JSON.stringify({ githubUrl }),
  });
}

// Delete a saved repository
export function deleteRepository(repositoryId) {
  return request(`/api/repositories/${repositoryId}`, {
    method: "DELETE",
  });
}

// Start analysis for a saved repository
export function analyzeRepository(repositoryId) {
  return request(`/api/analysis/repositories/${repositoryId}`, {
    method: "POST",
  });
}

// Fetch all analysis reports
export function getAnalysisReports() {
  return request("/api/analysis");
}

// Fetch a specific analysis report
export function getAnalysisReport(reportId) {
  return request(`/api/analysis/${reportId}`);
}

// Delete a saved analysis report
export function deleteAnalysisReport(reportId) {
  return request(`/api/analysis/${reportId}`, {
    method: "DELETE",
  });
}

// Ask a question against the indexed source code of a repository.
export function chatWithRepository(repositoryId, question) {
  return request(`/api/repositories/${repositoryId}/chat`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}