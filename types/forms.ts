/** Estado que devuelven las Server Actions de formularios (useActionState). */
export type FormState =
  | {
      error?: string;
      success?: string;
      fieldErrors?: Record<string, string>;
      /** Valores a rellenar de nuevo tras un error (nunca la contraseña). */
      values?: Record<string, string>;
    }
  | undefined;
