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
import { Book, Hash, Loader2, Type } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { FiCheck, FiPlus } from "react-icons/fi";

type ReadabilityResponse = {
  success: boolean;
  message?: string;
  corrections?: Corrections;
  error?: string;
};

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
};

type Corrections = {
  matches: Match[];
  language: LanguageData;
};


const InputContent: React.FC = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<ReadabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixedMatches, setFixedMatches] = useState<Record<string, boolean>>({});

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
    try {
      
      const response = await axios.post('/api/insert-keyword', { match, replacement ,content});

      toast.success("Insert Successfully",{
        description: response.data.message,
        duration: 2000,
      });

      setContent(response.data.newContent);
      setValue('content', response.data.newContent);
  
      const matchKey = `${match.offset}-${match.length}-${match.message.substring(0, 20)}`;
      setFixedMatches(prev => ({ ...prev, [matchKey]: true }));
    } catch (error) {
      console.log(error);

      toast.error("Error", {
        description: "Failed to Insert the keyword",
        duration: 2000,
      });
      
    }finally{
      setLoading(false);
    }

  };

  const MatchesSep = (matches: Match[]) => {
    const corrections: Match[] = [];
    const suggestions: Match[] = [];

    matches.forEach(match => {
      const matchKey = `${match.offset}-${match.length}-${match.message.substring(0, 20)}`;
      
      if (match.replacements.length === 1 && !fixedMatches[matchKey]) {
        corrections.push(match);
      } else {
        suggestions.push(match);
      }
    });

    return { corrections, suggestions };
  };

  const joinMatches = (matches: Match[]) => {
    const sentenceMap: Record<string, Match[]> = {};
    
    matches.forEach(match => {
      const sentence = match.context.text;
      if (!sentenceMap[sentence]) {
        sentenceMap[sentence] = [];
      }
      sentenceMap[sentence].push(match);
    });
    
    return sentenceMap;
  };

  const { corrections, suggestions } = results?.corrections?.matches 
    ? MatchesSep(results.corrections.matches) 
    : { corrections: [], suggestions: [] };
    
  const correctionGroups = joinMatches(corrections);
  const suggestionGroups = joinMatches(suggestions);


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
        <div className="mt-6">
          {!results.success ? (
            <div className="text-red-500 p-4 bg-red-50 rounded">
              Error: {results.error || 'Unknown error'}
            </div>
          ) : (
              <div className="">
                <div className="grid grid-cols-3 gap-4 mb-6 p-4  rounded">
                  <div className="text-center">
                    <h3 className="font-semibold">Word Count</h3>
                    <p className="text-2xl">{calculateWordCount(content)}</p>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold">Language</h3>
                    <p className="text-xl">
                      {results.corrections?.language?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold">Issues Found</h3>
                    <p className="text-2xl">
                      {results.corrections?.matches?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="border rounded-xl p-4 grid space-x-1 grid-cols-2">
                  {(corrections.length > 0 || suggestions.length > 0) ? (
                    <div className="  overflow-hidden">
                      {corrections.length > 0 && (
                        <>
                          <h2 className=" p-3 font-bold text-blue-800">Corrections</h2>
                          
                          {Object.entries(correctionGroups).map(
                            ([sentence, matches], idx) => (
                              <div key={`corr-${idx}`} className="p-4 border-b">
                                <p className="mb-3 text-gray-700">{sentence}</p>
                                
                                <div className="space-y-3">
                                  {matches.map((match, matchIdx) => {
                                    const matchKey = `${match.offset}-${match.length}-${match.message.substring(0, 20)}`;
                                    const isFixed = fixedMatches[matchKey];
                                    
                                    return (
                                      <div key={`corr-match-${matchIdx}`} className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p className="font-medium text-red-600">
                                            {match.message}
                                          </p>
                                          {match.replacements.length > 0 && (
                                            <p className="text-sm text-gray-600 mt-1">
                                              <span className="font-semibold">Suggestion:</span>{' '}
                                              {match.replacements[0].value}
                                            </p>
                                          )}
                                        </div>
                                        
                                        <div className="ml-4">
                                          {isFixed ? (
                                            <span className="text-green-600 flex items-center bg-green-100 px-2 py-1 rounded">
                                              <FiCheck className="mr-1" /> Applied
                                            </span>
                                          ) : (
                                            <button
                                              onClick={() => handleFix(match, match.replacements[0].value)}
                                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 flex items-center"
                                            >
                                              <FiPlus className="mr-1" /> Insert
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )
                          )}
                        </>
                      )}

                      {suggestions.length > 0 && (
                        <>
                          <h2 className="bg-yellow-100 p-3 font-bold text-yellow-800">Suggestions</h2>
                          
                          {Object.entries(suggestionGroups).map(
                            ([sentence, matches], idx) => (
                              <div key={`sugg-${idx}`} className="p-4 border-b">
                                <p className="mb-3 text-gray-700">{sentence}</p>
                                
                                <div className="space-y-3">
                                  {matches.map((match, matchIdx) => (
                                    <div key={`sugg-match-${matchIdx}`} className="flex items-start">
                                      <div className="flex-1">
                                        <p className="font-medium text-yellow-600">
                                          {match.message}
                                        </p>
                                        {match.replacements.length > 0 && (
                                          <p className="text-sm text-gray-600 mt-1">
                                            <span className="font-semibold">Possible improvements:</span>{' '}
                                            {match.replacements.map(r => r.value).join(', ')}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-green-50 text-green-700 rounded-lg">
                      No issues found! Your text looks great.
                    </div>
                  )}

                  <div className="border-l  p-5">
                    {content}
                  </div>
                </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InputContent;