import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const InputField = ({
  name,
  label,
  placeholder,
  register,
  error,
  validation,
  disabled,
  value,
  type = "text",
}: FormInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="form-label">{label}</Label>
      <Input
        id={name}
        name={name}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        value={value}
        {...register(name, validation)}
        className={cn('form-input', { 'opacity-50 cursor-not-allowed': disabled})}
      />
      {error && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  );
};

export default InputField;
