'use client';
export function Select(props: any) {
  return (
    <div className="relative">
      <select {...props} className={"w-full border p-2 rounded appearance-none bg-white " + (props.className || "")}>
        {props.children || <option>Default Option</option>}
      </select>
    </div>
  );
}