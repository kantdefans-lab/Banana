'use client';
export function Button(props: any) {
  return (
    <button {...props} className={"px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition " + (props.className || "")}>
      {props.children}
    </button>
  );
}