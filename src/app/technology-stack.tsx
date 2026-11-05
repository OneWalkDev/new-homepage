import type { IconType } from "react-icons";
import { FaAws, FaDocker, FaLaravel, FaPhp, FaReact } from "react-icons/fa";
import { SiMysql, SiNextdotjs, SiPostgresql, SiTerraform, SiTypescript } from "react-icons/si";

const primaryIcons: Readonly<Partial<Record<string, IconType>>> = {
  Laravel: FaLaravel,
  PHP: FaPhp,
  "Next.js": SiNextdotjs,
  React: FaReact,
  TypeScript: SiTypescript,
  MySQL: SiMysql,
  PostgreSQL: SiPostgresql,
  Docker: FaDocker,
  AWS: FaAws,
  Terraform: SiTerraform,
};

export default function TechnologyStack({ technologies }: { technologies: string }) {
  // Only spaced slashes delimit labels; names such as C#/.NET stay intact.
  const names = technologies.split(/\s+\/\s+/);
  return <p className="technology-stack string technical">{names.map((name, index) => {
    const Icon = Object.hasOwn(primaryIcons, name) ? primaryIcons[name] : undefined;
    return <span className="technology-entry" key={`${index}-${name}`}>
      <span className="technology-label">{Icon && <Icon className="technology-icon" size={18} aria-hidden="true" focusable="false" />}<span>{name}</span></span>
      {index < names.length - 1 && <span className="technology-separator" aria-hidden="true"> / </span>}
    </span>;
  })}</p>;
}
