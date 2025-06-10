import { inputSchema } from '@/schema/inputSchema';
import axios, { AxiosError } from 'axios';
import { NextRequest, NextResponse } from 'next/server';


export type ReadabilityResponse = {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {

    try {
        const body = await req.json();
        const parsed = inputSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
            { success: false, message: 'Invalid input', errors: parsed.error.errors },
            { status: 400 }
            );
        }

        const { content, language = 'en' } = parsed.data;

        const supportedLanguages = ['en', 'de', 'fr', 'es', 'it'];
        const lang = supportedLanguages.includes(language) ? language : 'en';

        if (!content || typeof content !== 'string') {
            return NextResponse.json(
            { success: false, message: 'Content is required and must be a string.' },
            { status: 400 }
            );
        }

        const  languagetoolResponse = await axios.post(
        'https://api.languagetool.org/v2/check',
        new URLSearchParams({
            text: content,
            language: lang,
        }),
        {
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
        );

        return NextResponse.json(
            {
            success: true,
            message: 'Content analyzed successfully',
            corrections: languagetoolResponse.data
            },
            { status: 200 }
        );

    } catch (error) {
        console.log(error);
        const axiosError = error as AxiosError;
        console.error('API error:', axiosError.response?.data || axiosError.message);

        const statusCode = axiosError.response?.status || 500;
        const errorMsg = (axiosError.response?.data as { message?: string })?.message || 'Failed to connect to API';

        return NextResponse.json(
            {
            success: false,
            error: errorMsg,
            },
            { status: statusCode }
        );
    }
}
