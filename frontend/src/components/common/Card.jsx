import { cn } from "../../utils/cn";

function Card({ children, className }) {
  return <section className={cn("surface-card rounded-2xl", className)}>{children}</section>;
}

export default Card;
