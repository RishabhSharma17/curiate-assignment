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
import { Loader2, Type, Hash, Book } from "lucide-react";
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
  { label: "English", value: "en", flag: "🇬🇧" },
  { label: "French", value: "fr", flag: "🇫🇷" },
  { label: "Italian", value: "it", flag: "🇮🇹" },
  { label: "German", value: "de", flag: "🇩🇪" },
  { label: "Spanish", value: "es", flag: "🇪🇸" },
];

const InputContent: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ReadabilityResponse | null>(null);

  const form = useForm<z.infer<typeof inputSchema>>({
    resolver: zodResolver(inputSchema),
    defaultValues: {
      content: "",
      language: "en",
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
      const axiosError = error as AxiosError<ReadabilityResponse>;
      toast.error("Error", {
        description: axiosError?.response?.data?.message ?? "Failed to analyze content",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onsubmit)} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Content Analysis
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Enter your content to analyze SEO metrics and readability
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="min-w-[140px] capitalize border-2"
                  >
                    {selectedLang ? (
                      <span className="flex items-center gap-2">
                        {LANGUAGES.find((l) => l.value === selectedLang)?.flag}
                        {LANGUAGES.find((l) => l.value === selectedLang)?.label}
                      </span>
                    ) : (
                      "Select Language"
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[140px]">
                  {LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                      key={lang.value}
                      onClick={() => setValue("language", lang.value)}
                      className="cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {lang.flag} {lang.label}
                      </span>
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
                    className="min-h-[200px] text-lg p-5 rounded-lg border-2 focus:border-indigo-500 transition-all"
                    placeholder="Write or paste your content here to analyze..."
                    {...field}
                  />
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <div className="flex justify-end mt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Content'
                )}
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>

      {result && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border p-6 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Analysis Results
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Type className="h-4 w-4" />
                <span>Word Count</span>
              </div>
              <p className="text-2xl font-bold">{result.wordCount}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Hash className="h-4 w-4" />
                <span>Character Count</span>
              </div>
              <p className="text-2xl font-bold">{result.characterCount}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Book className="h-4 w-4" />
                <span>Readability Score</span>
              </div>
              <p className="text-2xl font-bold">{result.readabilityScore}</p>
            </div>
          </div>

          {result.corrections && result.corrections.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Suggested Improvements</h3>
              <div className="flex flex-wrap gap-2">
                {[...new Set(
                  result.corrections
                    .flatMap(c => c.replacements.map((r: { value: any; }) => r.value))
                )].map((word, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    size="sm"
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-900/70"
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