import Image from "next/image";

function createIconComponent(src: string, alt: string) {
  return function Icon(props: {
    width?: number;
    height?: number;
    className?: string;
  }) {
    const { width = 24, height = 24, className } = props;
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  };
}

export const GridIcon = createIconComponent("/admin-icons/grid.svg", "Grid Icon");
export const GroupIcon = createIconComponent("/admin-icons/group.svg", "Group Icon");
export const BoxIconLine = createIconComponent(
  "/admin-icons/box-line.svg",
  "Box Line Icon"
);
export const DollarLineIcon = createIconComponent(
  "/admin-icons/dollar-line.svg",
  "Dollar Line Icon"
);
export const ChevronDownIcon = createIconComponent(
  "/admin-icons/chevron-down.svg",
  "Chevron Down Icon"
);
export const ListIcon = createIconComponent("/admin-icons/list.svg", "List Icon");
export const TableIcon = createIconComponent(
  "/admin-icons/table.svg",
  "Table Icon"
);
export const HorizontaLDots = createIconComponent(
  "/admin-icons/horizontal-dots.svg",
  "Horizontal Dots Icon"
);
export const MoreDotIcon = createIconComponent(
  "/admin-icons/more-dot.svg",
  "More Dot Icon"
);
