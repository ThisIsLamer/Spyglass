interface LogBlockOptions {
  title: string;
  fields: Record<string, string>;
  warning?: string;
}

export function logBlock({ title, fields, warning }: LogBlockOptions): void {
  console.log(`\n${title}`)

  for (const [key, value] of Object.entries(fields)) {
    console.log(`   ${key}: ${value}`)
  }

  if (warning) {
    console.log(warning)
  }

  console.log('')
}
