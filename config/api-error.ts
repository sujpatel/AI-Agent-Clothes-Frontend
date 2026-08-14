/** Turns a failed fetch Response into a message worth showing someone who
 * isn't a developer — never a bare status code or a raw backend error body. */
export async function friendlyErrorMessage(response: Response): Promise<string> {
  if (response.status === 401 || response.status === 403) {
    return "You're not signed in — please log in again.";
  }
  if (response.status === 429) {
    return "You're doing that a bit fast — give it a moment and try again.";
  }
  if (response.status === 503) {
    return 'The AI service is temporarily overloaded. Please try again in a moment.';
  }
  if (response.status >= 500) {
    return 'Something went wrong on our end — please try again.';
  }
  if (response.status === 404) {
    return "That couldn't be found — it may have already been removed.";
  }
  if (response.status >= 400) {
    return "That didn't go through — please check and try again.";
  }
  return 'Something went wrong — please try again.';
}
