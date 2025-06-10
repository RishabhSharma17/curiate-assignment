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
import { Book, CheckCircle, Globe, Hash, Loader2, Type } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

const LANGUAGES = [
  { label: "English", value: "en", flag: "🇬🇧" },
  { label: "French", value: "fr", flag: "🇫🇷" },
  { label: "Italian", value: "it", flag: "🇮🇹" },
  { label: "German", value: "de", flag: "🇩🇪" },
  { label: "Spanish", value: "es", flag: "🇪🇸" },
];

type Replacement = {
  value: string;
};

export type Match = {
  message: string;
  shortMessage: string;
  replacements: Replacement[];
  offset: number;
  length: number;
  context: {
    text: string;
  };
};

type LanguageData = {
  name: string;
  code: string;
  detectedLanguage?: {
    name: string;
    code: string;
    confidence: number;
    source: string;
  };
};

type Corrections = {
  matches: Match[];
  language: LanguageData;
  sentenceRanges?: number[][];
};

type ReadabilityResponse = {
  success: boolean;
  message?: string;
  corrections?: Corrections;
  error?: string;
};

const countSyllables = (word: string): number => {
  word = word.toLowerCase();
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const syllableCount = word.match(/[aeiouy]{1,2}/g);
  return syllableCount ? syllableCount.length : 1;
};

const calculateReadabilityScore = (text: string): number => {
  if (!text.trim()) return 0;
  
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const words = text.trim().split(/\s+/);
  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  
  const wordsPerSentence = words.length / sentences.length;
  const syllablesPerWord = totalSyllables / words.length;
  const score = 206.835 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord);
  
  return Number(score.toFixed(1));
};

const getReadabilityLevel = (score: number): { level: string; color: string } => {
  if (score >= 90) return { level: 'Very Easy', color: 'text-green-500' };
  if (score >= 80) return { level: 'Easy', color: 'text-emerald-500' };
  if (score >= 70) return { level: 'Fairly Easy', color: 'text-blue-500' };
  if (score >= 60) return { level: 'Standard', color: 'text-yellow-500' };
  if (score >= 50) return { level: 'Fairly Difficult', color: 'text-orange-500' };
  if (score >= 30) return { level: 'Difficult', color: 'text-red-500' };
  return { level: 'Very Difficult', color: 'text-red-600' };
};

const InputContent: React.FC = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<ReadabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixedMatches, setFixedMatches] = useState<Record<string, string>>({});

  const form = useForm<z.infer<typeof inputSchema>>({
    resolver: zodResolver(inputSchema),
    defaultValues: {
      content: "",
      language: "en",
    },
  });

  const { handleSubmit, control, setValue, watch } = form;
  const selectedLang = watch("language");

  const calculateWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };
  
  const onsubmit = async (data: z.infer<typeof inputSchema>) => {
    setIsSubmitting(true);
    setFixedMatches({});
    try {
      const response = await axios.post<ReadabilityResponse>("/api/analyze", data);
      if (response.data.success) {
        toast.success("Analysis complete", {
          description: response.data.message,
          duration: 4000,
        });
        setResults(response.data);
      } else {
        setResults({
          success: false,
          error: 'Failed to analyze content'
        });
        toast.error("Failed", {
          description: response.data.message ?? "Unknown error",
          duration: 4000,
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<ReadabilityResponse>;
      setResults({
        success: false,
        error: 'Failed to analyze content'
      });
      toast.error("Error", {
        description: axiosError?.response?.data?.message ?? "Failed to analyze content",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFix = async (match: Match, replacement: string) => {
    if (!results?.corrections) return;
    setLoading(true);
    
    const matchKey = `${match.offset}-${match.length}-${match.message.substring(0, 20)}`;
    
    try {
      const response = await axios.post('/api/insert-keyword', { match, replacement, content });
      toast.success("Insert Successfully", {
        description: response.data.message,
        duration: 2000,
      });
      setContent(response.data.newContent);
      setValue('content', response.data.newContent);
      
      setFixedMatches(prev => ({
        ...prev,
        [matchKey]: replacement
      }));
    } catch {
      toast.error("Error", {
        description: "Failed to Insert the keyword",
        duration: 2000,
      });
    } finally {
      setLoading(false);
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
                  <Button variant="outline" className="min-w-[140px] capitalize border-2">
                    {selectedLang ? (
                      <span className="flex items-center gap-2">
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
                        {lang.label}
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
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e);
                      setContent(e.target.value);
                    }}
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

      {results && (
        <div className="mt-8">
          {!results.success ? (
            <div className="text-red-500 p-4 bg-red-50 rounded-lg">
              Error: {results.error || 'Unknown error'}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border p-6">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
                Analysis Results
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                    <Type className="h-4 w-4" />
                    <span className="text-sm font-medium">Word Count</span>
                  </div>
                  <p className="text-2xl font-bold">{calculateWordCount(content)}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                    <Hash className="h-4 w-4" />
                    <span className="text-sm font-medium">Characters</span>
                  </div>
                  <p className="text-2xl font-bold">{content.length}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm font-medium">Language</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {results.corrections?.language?.detectedLanguage?.name || 'Unknown'}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                    <Book className="h-4 w-4" />
                    <span className="text-sm font-medium">Readability</span>
                  </div>
                  {content && (
                    <>
                      <p className="text-2xl font-bold">{calculateReadabilityScore(content)}</p>
                      <p className={`text-sm mt-1 ${getReadabilityLevel(calculateReadabilityScore(content)).color}`}>
                        {getReadabilityLevel(calculateReadabilityScore(content)).level}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Sentence Analysis */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Content Structure</h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
                  <div className="space-y-2">
                    {results.corrections?.sentenceRanges?.map((range, index) => (
                      <div key={index} className="text-sm text-gray-600 dark:text-gray-300 p-2 border-b last:border-0">
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          Sentence {index + 1}:
                        </span>{' '}
                        {content.slice(range[0], range[1])}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Issues Section */}
              {results.corrections?.matches && results.corrections.matches.length > 0 ? (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Grammar & Style Suggestions</h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
                    {results.corrections.matches.map((match, index) => {
                      const matchKey = `${match.offset}-${match.length}-${match.message.substring(0, 20)}`;
                      const appliedReplacement = fixedMatches[matchKey];
                      
                      return (
                        <div key={index} className="mb-4 last:mb-0 p-3 border-b last:border-0">
                          <p className="font-medium text-red-600 dark:text-red-400">
                            {match.message}
                          </p>
                          {match.replacements.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {match.replacements.map((r, idx) => {
                                const isApplied = appliedReplacement === r.value;
                                
                                return (
                                  <Button
                                    key={idx}
                                    variant={isApplied ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => !isApplied && handleFix(match, r.value)}
                                    className={isApplied 
                                      ? "bg-green-500 text-white hover:bg-green-500" 
                                      : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300"
                                    }
                                    disabled={isApplied || loading}
                                  >
                                    {isApplied ? (
                                      <span className="flex items-center gap-1">
                                        <CheckCircle className="h-4 w-4" /> Applied
                                      </span>
                                    ) : (
                                      r.value
                                    )}
                                  </Button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">No issues found! Your text looks great.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InputContent;