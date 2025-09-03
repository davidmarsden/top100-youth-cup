export function isAdminRequest(headers: Headers) {
  const h = headers.get('x-admin-key') || '';
  return !!process.env.ADMIN_KEY && h === process.env.ADMIN_KEY;
}