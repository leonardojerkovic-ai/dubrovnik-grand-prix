"use client";

import { useTransition } from "react";
import { updateUserRole } from "./actions";

export function RoleSelect({
  userId,
  currentRoleValue,
  disabled,
}: {
  userId: string;
  currentRoleValue: string;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={currentRoleValue}
      disabled={disabled || isPending}
      onChange={(e) => {
        const role = e.target.value as
          | "PLAYER"
          | "SUDAC"
          | "GP_MANAGER"
          | "ADMIN";
        startTransition(async () => {
          await updateUserRole(userId, role);
        });
      }}
      className="input"
    >
      <option value="PLAYER">Igrač</option>
      <option value="SUDAC">Sudac — samo novčane nagrade</option>
      <option value="GP_MANAGER">Voditelj GP-a</option>
      <option value="ADMIN">Administrator</option>
    </select>
  );
}
