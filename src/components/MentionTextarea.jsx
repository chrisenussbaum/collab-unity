import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { getCachedAllUserProfiles } from "@/lib/userProfileCache";

export default function MentionTextarea({ value, onChange, placeholder, rows = 4, className = "", disabled, users }) {
  const [allUsers, setAllUsers] = useState(users || []);
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (users && users.length) {
      setAllUsers(users);
      return;
    }
    let active = true;
    getCachedAllUserProfiles()
      .then((list) => {
        if (active) setAllUsers(list || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [users]);

  const handleChange = (e) => {
    onChange(e.target.value);
    const pos = e.target.selectionStart;
    const upTo = e.target.value.slice(0, pos);
    const m = upTo.match(/@([a-zA-Z0-9_\u00C0-\u017F]*)$/);
    if (m) {
      const q = m[1];
      const ql = q.toLowerCase();
      const filtered = allUsers
        .filter((u) => {
          const name = (u.full_name || "").toLowerCase();
          const uname = (u.username || "").toLowerCase();
          const ep = (u.email || "").split("@")[0].toLowerCase();
          return (
            !q ||
            name.includes(ql) ||
            uname.includes(ql) ||
            name.split(" ").some((p) => p.startsWith(ql)) ||
            ep.includes(ql)
          );
        })
        .slice(0, 5);
      setSuggestions(filtered);
      setShow(filtered.length > 0);
    } else {
      setShow(false);
      setSuggestions([]);
    }
  };

  const insertMention = (user) => {
    const pos = ref.current ? ref.current.selectionStart : value.length;
    const upTo = value.slice(0, pos);
    const atIdx = upTo.search(/@[a-zA-Z0-9_\u00C0-\u017F]*$/);
    const before = atIdx >= 0 ? value.slice(0, atIdx) : value.slice(0, pos);
    const after = value.slice(pos);
    const token = `@${user.username || user.full_name?.split(" ")[0] || user.email.split("@")[0]} `;
    const next = `${before}${token}${after}`;
    onChange(next);
    setShow(false);
    setSuggestions([]);
    setTimeout(() => {
      if (ref.current) {
        const p = before.length + token.length;
        ref.current.focus();
        ref.current.setSelectionRange(p, p);
      }
    }, 0);
  };

  return (
    <div className="relative">
      <Textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className={className}
        disabled={disabled}
      />
      {show && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full max-h-48 overflow-y-auto shadow-xl border-2 border-purple-200 bg-white">
          {suggestions.map((u) => (
            <div
              key={u.id || u.email}
              className="flex items-center p-3 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertMention(u)}
            >
              <Avatar className="w-8 h-8 mr-3">
                <AvatarImage src={u.profile_image} />
                <AvatarFallback className="bg-purple-100 text-purple-600 text-sm">
                  {u.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium text-gray-900">{u.full_name || "Unknown"}</div>
                <div className="text-xs text-gray-500">@{u.username || u.email?.split("@")[0]}</div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}