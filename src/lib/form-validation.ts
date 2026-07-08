export function getFieldErrorLabelClass(hasError: boolean) {
  return hasError ? '[&_label]:text-red-500' : undefined;
}

export function getFieldErrorInputClass(hasError: boolean) {
  return hasError ? 'border-red-500 focus:border-red-500' : '';
}

export function getInlineErrorTextClass() {
  return 'text-[12px] text-red-500';
}

export function getPlainLabelErrorClass(hasError: boolean) {
  return hasError ? 'text-red-500' : 'text-muted-foreground';
}
