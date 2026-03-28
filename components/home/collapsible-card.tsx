"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function CollapsibleCard({
  title,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [height, setHeight] = useState<number | "auto">(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    if (open) {
      const scrollHeight = contentRef.current.scrollHeight;
      setHeight(scrollHeight);

      const timeout = setTimeout(() => {
        setHeight("auto");
      }, 300);

      return () => clearTimeout(timeout);
    } else {
      const scrollHeight = contentRef.current.scrollHeight;
      setHeight(scrollHeight);

      requestAnimationFrame(() => {
        setHeight(0);
      });
    }
  }, [open]);

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? (
            <>
              Ocultar <ChevronUp className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Ver <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardHeader>

      <div
        style={{ height }}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out"
        )}
      >
        <div ref={contentRef} className="p-6 pt-0">
          {children}
        </div>
      </div>
    </Card>
  );
}