import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export function renderContentWithMentions(content, { own = false } = {}) {
  if (!content) return null;
  const parts = String(content).split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (/^@\w+$/.test(part)) {
      return (
        <Link
          key={i}
          to={createPageUrl(`UserProfile?username=${part.slice(1)}`)}
          className="font-bold hover:underline"
          style={{ color: own ? "#c4b5fd" : "#7c3aed" }}
        >
          {part}
        </Link>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export function extractMentionedEmails(content, users) {
  if (!content || !users || !users.length) return [];
  const emails = [];
  const re = /@(\w+)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const name = m[1].toLowerCase();
    const user = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === name) ||
        (u.full_name && u.full_name.split(" ")[0].toLowerCase() === name) ||
        (u.email && u.email.split("@")[0].toLowerCase() === name)
    );
    if (user && !emails.includes(user.email)) emails.push(user.email);
  }
  return emails;
}