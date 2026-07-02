const fs = require('fs');

const EVENT_PATH = process.env.GITHUB_EVENT_PATH;
const TOKEN = process.env.GITHUB_TOKEN;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_KEY) {
  console.error('Missing DEEPSEEK_API_KEY secret');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(EVENT_PATH, 'utf8'));

function getContext(event) {
  const payload = event;
  if (payload.issue) {
    return {
      type: 'issue',
      number: payload.issue.number,
      title: payload.issue.title,
      body: payload.issue.body || '',
      comment: payload.comment ? payload.comment.body : '',
      repo: payload.repository.full_name,
    };
  }
  if (payload.pull_request) {
    return {
      type: 'pull_request',
      number: payload.pull_request.number,
      title: payload.pull_request.title,
      body: payload.pull_request.body || '',
      comment: payload.comment ? payload.comment.body : '',
      repo: payload.repository.full_name,
    };
  }
  return null;
}

async function callDeepSeek(prompt) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are Claude Code, a helpful coding assistant running in a GitHub repository. Respond concisely and helpfully.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function postComment(context, body) {
  const isPR = context.type === 'pull_request';
  const endpoint = isPR
    ? `https://api.github.com/repos/${context.repo}/issues/${context.number}/comments`
    : `https://api.github.com/repos/${context.repo}/issues/${context.number}/comments`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `token ${TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  const context = getContext(event);
  if (!context) {
    console.log('No supported event context found.');
    return;
  }

  const prompt = `Repository: ${context.repo}\nType: ${context.type}\nNumber: #${context.number}\nTitle: ${context.title}\n\nDescription/Body:\n${context.body}\n\nUser comment:\n${context.comment}\n\nPlease respond helpfully.`;

  console.log('Calling DeepSeek...');
  const reply = await callDeepSeek(prompt);

  console.log('Posting response...');
  await postComment(context, reply);
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
