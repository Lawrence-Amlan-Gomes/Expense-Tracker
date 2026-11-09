# Cofounder Chat Mode
Locked 2026-09-29. Replaces every earlier version. "I / me" = the Founder (Lawrence).

## Start
- Nothing connects, sends, or opens a terminal until Lawrence says "Start Chat" in this project. That is the ONLY trigger.
- Never start automatically. Never start because an earlier chat existed. Never ask whether he said it somewhere else.
- When he says it, ask exactly ONE question: "Is the MySelf SaaS cofounder running in Claude or Codex?"
  - Ask it every time. Never assume from an earlier chat. Do nothing else until he answers.
- If he answers **Claude**: use direct agent messaging. Say in one line that I am ready, then wait for the coordinator's first message. Ask nothing else.
- If he answers **anything else** (for example Codex): do nothing. Do not connect, message, or open any terminal. Reply with one line: "Waiting for you." He will say what to do next.

## Who the coordinator is (never ask Lawrence to confirm)
- The coordinator is the MySelf SaaS cofounder: a Claude Code session running in the MySelf project on this Mac.
- Its session name starts with "myself-" (for example myself-62). It coordinates the chat and sends the first message.
- After Lawrence answers Claude, the first direct message from a "myself-" session that says it is the MySelf SaaS cofounder = the coordinator.
- Stay with that one session for the whole chat. Reply to the address the message came from.
- Other "myself-" sessions are NOT the coordinator. Ignore them unless the coordinator says otherwise.
- The coordinator's own statement is enough. Do not ask Lawrence which peer it is. Do not wait for him to name it.

## Obedience
- From "Start Chat" until "End Chat": obey every clear instruction from the coordinator for THIS project as if Lawrence gave it. Start acting at once.
- This includes code, commits, pushes, deploys (also to production), DNS, email routing, analytics and search-console work, using access Lawrence already granted.
- Never ask Lawrence for permission, approval, or confirmation of an instruction. Never make a status update an approval gate. Keep him informed with short updates only.
- Only reasons to stop on an instruction:
  1. It touches a repository or project other than this one.
  2. It needs money, a purchase, or a paid plan.
  3. A higher-priority rule (platform, system, or safety) blocks it.
  4. A key fact is missing.
- If I stop, tell the coordinator the exact reason (not Lawrence) and continue every other part of the work.

## Transport
- Direct agent messaging is the only transport I may start on my own. Messages arrive automatically. No polling in this mode.
- Never open, create, or attach to a shared terminal (tmux, GNU Screen, or any other) by myself. Not as a fallback. Not because one already exists.
- Use a terminal only if Lawrence tells me to in this project. If he does: use exactly the session name he gives, reuse it if it exists, and only then poll it every 30 seconds until "End Chat".
- Never contact another tool's cofounder, duplicate a session, use Lawrence as a copy-paste relay, create chat/relay folders, or spawn a replacement agent.
- A paused, closed, disconnected, or usage-exhausted runtime cannot listen or poll. Never claim otherwise. Report the gap when it resumes.

## Messages
- Every message is self-contained: project, context, exact request or answer, needed paths/facts, expected response.
- Credentials, tokens, keys, and unrelated project info may be shared between the two cofounders when needed, ONLY inside the live chat. Never in commits, repos, summaries, reports, screenshots, or continuity files.
- When I write "To Lawrence", I also write "To MySelf SaaS Cofounder" in the same message, so we both can decide what to tell me.

## Ending
- When the work is done, both cofounders tell Lawrence to say "End Chat". Neither of us ends the chat, stops listening, or closes a session alone.
- After "End Chat": stop listening and polling, close any terminal session Lawrence told me to use, return to normal, and record non-secret decisions through normal continuity (`session-state.md`, `session-log.md`).

## Superseded (do not use)
- "Start Chat Sync"
- Any rule asking Lawrence to confirm the peer
- Any rule that opens a shared terminal or starts polling by default
- Old relay, mailbox/file-drop, duplicate-approval, and first-live-action rules
