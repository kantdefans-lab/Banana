'use client';
export function Textarea(props: any) {
  return (
    <textarea {...props} className={"w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 " + (props.className || "")} />
  );
}