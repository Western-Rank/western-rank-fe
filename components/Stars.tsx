import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

type StarsProps = {
  value: number;
  size: number;
  theme: "purple" | "blue";
};

const activatedFill = {
  purple: "fill-purple-600",
  blue: "fill-blue-400",
};

const deactivatedFill = {
  purple: "fill-purple-200",
  blue: "fill-blue-100",
};

const Stars = ({ value, size, theme }: StarsProps) => {
  const starValue = value >= 0 ? value : 0;
  const quotient = Math.floor(starValue);
  const remainder = value - quotient;
  const rest = 5 - Math.ceil(starValue);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <div className="flex">
            {[...Array(quotient)].map((i) => (
              <Star size={size} color="" key={i} className={cn("px-0", activatedFill[theme])} />
            ))}
            {remainder > 0 && (
              <>
                <Star
                  size={size}
                  style={{ width: remainder * size }}
                  preserveAspectRatio="xMinYMin slice"
                  color=""
                  className={cn("px-0", activatedFill[theme])}
                />
                <Star
                  size={size}
                  style={{ width: (1 - remainder) * size }}
                  color=""
                  preserveAspectRatio="xMaxYMax slice"
                  className={cn("px-0", deactivatedFill[theme])}
                />
              </>
            )}
            {[...Array(rest)].map((i) => (
              <Star size={size} color="" key={i} className={deactivatedFill[theme]} />
            ))}
            <p className="sr-only">{value} of 5 Stars</p>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{value} of 5 Stars</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default Stars;
