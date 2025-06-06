"use client";
import { inputSchema } from "@/schema/inputSchema";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

type ReadabilityResponse = {
  success: boolean;
  message?: string;
  embedding?: any;
  corrections?: any[];
  error?: string;
  wordCount?: number;
  characterCount?: number;
  readabilityScore?: number;
};

const LANGUAGES = [
  { label: "English", value: "en" },
  { label: "French", value: "fr" },
  { label: "Italian", value: "it" },
  { label: "German", value: "de" },
  { label: "Spanish", value: "es" },
];

const InputContent: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ReadabilityResponse | null>(null);

  const form = useForm<z.infer<typeof inputSchema>>({
    resolver: zodResolver(inputSchema),
    defaultValues: {
      content: "",
    },
  });

  const { handleSubmit, control, setValue, watch } = form;
  const selectedLang = watch("language");

  const countSyllables = (word: string): number => {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    word = word.replace(/^y/, "");
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  };

  const getFleschReadingEase = (text: string): number => {
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;
    const words = text.trim().split(/\s+/);
    const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
    const ASL = words.length / (sentences || 1);
    const ASW = syllables / (words.length || 1);
    return 206.835 - 1.015 * ASL - 84.6 * ASW;
  };

  const onsubmit = async (data: z.infer<typeof inputSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post<ReadabilityResponse>("/api/analyze", data);
      if (response.data.success) {
        console.log(response.data);
        const content = data.content;
        const wordCount = content.trim().split(/\s+/).length;
        const characterCount = content.replace(/\s/g, "").length;
        const readabilityScore = parseFloat(getFleschReadingEase(content).toFixed(2));

        toast.success("Analysis complete", {
          description: response.data.message,
          duration: 4000,
        });

        setResult({
          ...response.data,
          wordCount,
          characterCount,
          readabilityScore,
        });
      } else {
        toast.error("Failed", {
          description: response.data.message ?? "Unknown error",
          duration: 4000,
        });
      }
    } catch (error) {
      const axioserror = error as AxiosError<ReadabilityResponse>;
      toast.error("Error", {
        description: axioserror?.response?.data?.message ?? "Failed to send message",
        duration: 4000,
        className: "bg-red-600 text-white",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onsubmit)}>
          <div className="flex items-center justify-between mb-2">
            <FormLabel className="text-2xl">Content</FormLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-28 capitalize">
                  {selectedLang
                    ? LANGUAGES.find((l) => l.value === selectedLang)?.label
                    : "Select Lang"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.value}
                    onClick={() => setValue("language", lang.value)}
                    className="cursor-pointer"
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <FormField
            control={control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <Textarea
                  className="resize-none h-40 text-lg p-5"
                  placeholder="Write your content here ..."
                  {...field}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex mt-5 justify-center">
            {isSubmitting ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                Send It
              </Button>
            )}
          </div>
        </form>
      </FormProvider>

      {result && (
        <div className="mt-10 p-5 rounded-md border shadow-sm ">
          <h2 className="text-2xl font-bold mb-4">Analysis Result</h2>
          <p><strong>Word Count:</strong> {result.wordCount}</p>
          <p><strong>Character Count:</strong> {result.characterCount}</p>
          <p><strong>Readability Score:</strong> {result.readabilityScore}</p>

          <h3 className="mt-6 text-xl font-semibold">Grammar Corrections</h3>
          {result.corrections && result.corrections.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold">Suggested Words</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {[...new Set(
                  result.corrections
                    .flatMap(c => c.replacements.map((r: { value: any; }) => r.value))
                )].map((word, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    size="sm"
                    className="capitalize"
                  >
                    {word}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InputContent;
