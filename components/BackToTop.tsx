import { Button } from "@/components/ui/button";

type BackToTopProps = {
  visible?: boolean;
  onClick?: () => void;
};

const BackToTop = ({ visible = false, onClick }: BackToTopProps) => {
  if (!visible) return null;

  return (
    <Button variant={"outline"} className="fixed bottom-3 right-3 bg-background" onClick={onClick}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        className="lucide lucide-arrow-up-to-line"
      >
        <path d="M5 3h14" />
        <path d="m18 13-6-6-6 6" />
        <path d="M12 7v14" />
      </svg>
    </Button>
  );
};

export default BackToTop;
