import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type RefObject, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
  error?: string;
};

type FieldControlProps = { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true };

export function Field({ children, description, error, id: providedId, label }: { children: (props: FieldControlProps) => ReactNode; description?: string; error?: string; id?: string; label: string }) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {description && <span id={descriptionId} className="form-field__description">{description}</span>}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error && <span id={errorId} className="form-field__error">{error}</span>}
    </div>
  );
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField({ description, error, id: providedId, label, ...props }, ref) {
  return <Field id={providedId} label={label} description={description} error={error}>{(controlProps) => <input {...props} {...controlProps} ref={ref} />}</Field>;
});

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; description?: string; error?: string }>(function TextareaField({ description, error, id, label, ...props }, ref) {
  return <Field id={id} label={label} description={description} error={error}>{(controlProps) => <textarea {...props} {...controlProps} ref={ref} />}</Field>;
});

export const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label: string; description?: string; error?: string }>(function SelectField({ children, description, error, id, label, ...props }, ref) {
  return <Field id={id} label={label} description={description} error={error}>{(controlProps) => <select {...props} {...controlProps} ref={ref}>{children}</select>}</Field>;
});

export type ErrorSummaryItem = { fieldId: string; fieldRef: RefObject<HTMLElement | null>; message: string };

export const ErrorSummary = forwardRef<HTMLElement, { errors: ErrorSummaryItem[] }>(function ErrorSummary({ errors }, ref) {
  if (!errors.length) return null;
  return (
    <section ref={ref} className="error-summary" role="alert" tabIndex={-1}>
      <h3>입력 내용을 확인해 주세요</h3>
      <ul>{errors.map((error) => <li key={error.fieldId}><a href={`#${error.fieldId}`} aria-controls={error.fieldId} onClick={(event) => { event.preventDefault(); error.fieldRef.current?.focus(); }}>{error.message}</a></li>)}</ul>
    </section>
  );
});
