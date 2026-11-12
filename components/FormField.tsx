interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  error?: string;
  autoComplete?: string;
  required?: boolean;
  maxLength?: number;
  hint?: string;
}

export default function FormField({
  label,
  name,
  type = 'text',
  defaultValue,
  error,
  autoComplete,
  required,
  maxLength,
  hint,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required={required}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 ${error ? 'border-red-500' : 'border-line'}`}
      />
      {hint && !error && (
        <p id={`${name}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
