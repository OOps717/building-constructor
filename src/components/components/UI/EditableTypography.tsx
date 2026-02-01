import { Typography, TextField } from "@mui/material";
import { useState, useRef, useEffect } from "react";

type EditableTypographyProps = {
  children: string;
  onChange: (value: string) => void;
};

export function EditableTypography({
  children,
  onChange,
}: EditableTypographyProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(children);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(children);
  }, [children]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    onChange(draft.trim());
  };

  const cancel = () => {
    setDraft(children);
    setEditing(false);
  };

  if (editing) {
    return (
      <TextField
        inputRef={inputRef}
        value={draft}
        variant="standard"
        size="small"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
      />
    );
  }

  return (
    <Typography onDoubleClick={() => setEditing(true)} sx={{ cursor: "text" }}>
      {children}
    </Typography>
  );
}
