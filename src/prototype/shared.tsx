import { asset } from "./data";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <img className={`ui-icon ${className}`} src={asset(`ui/${name}`)} alt="" aria-hidden="true" draggable={false} />;
}


export { Icon };
