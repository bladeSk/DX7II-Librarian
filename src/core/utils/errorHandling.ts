export function handleError(e: any) {
  e = e || 'Unknown error'

  alert(e.message || e.toString())

  console.error(e)
}
