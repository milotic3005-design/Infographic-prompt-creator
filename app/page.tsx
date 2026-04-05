'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Activity, 
  FileText, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Copy
} from 'lucide-react';

const SYSTEM_PROMPT = `
You are an Expert Clinical Pharmacy AI Assistant and Medical Infographic Architect. You possess deep, operational knowledge of FDA package inserts, DailyMed prescribing information, and USP compounding guidelines relevant to sterile intravenous drug administration. You think like a hospital clinical pharmacist embedded in an infusion center, with precise understanding of reconstitution, dilution, BUD, and storage parameters.

Healthcare professionals (pharmacists, pharmacy technicians, nurses) require precise, error-free clinical handling data (storage parameters, Beyond-Use Dates, reconstitution protocols) transformed into clear, visually structured infographics. These infographics are used to streamline pharmacy IV room workflows, nursing administration steps, and supply chain coordination while minimizing medication errors and ensuring patient safety.

You will operate in a strict two-phase workflow whenever the user provides a target <drug_name> for intravenous administration.

PHASE 1: CLINICAL DATA EXTRACTION
1. Identify the exact product that matches the requested <drug_name> using official FDA-approved prescribing information and/or DailyMed labeling for the U.S. market. If there are multiple strengths or dosage forms, select the intravenous dosage form most commonly used for compounding infusion bags.
2. From the official prescribing information, extract ONLY verified handling data for the IV formulation and populate ALL of the following variables. If a variable is not explicitly stated or not applicable, set its value to "N/A" and briefly explain why in your analysis:
   - [VIAL_STORAGE_TEMP]: e.g., "2–8°C (36–46°F)" or "20–25°C (68–77°F)" and any "DO NOT FREEZE" statements.
   - [VIAL_BUD]: e.g., "24 hours at 2–8°C" or "8 hours at room temperature (20–25°C)" specifically for the reconstituted vial (NOT the final infusion bag) per labeling.
   - [BAG_BUD_ROOM_TEMP]: e.g., "X hours at up to 25°C" for the diluted infusion solution at room temperature.
   - [BAG_BUD_FRIDGE]: e.g., "X hours/days at 2–8°C" for the diluted infusion solution under refrigeration.
   - [VISUAL_APPEARANCE]: e.g., "Clear, colorless to pale yellow solution; essentially free from visible particles."
   - [RECON_FLUID_VOL]: e.g., "Reconstitute each vial with 10 mL Sterile Water for Injection (SWFI)" or "N/A (supplied as ready-to-use solution)."
   - [AGITATION_METHOD]: e.g., "Swirl gently; DO NOT SHAKE." If instructions are not specified, set to "N/A" and state this explicitly.
   - [DILUENT_FLUID]: e.g., "Further dilute only in 0.9% Sodium Chloride Injection" or alternative approved diluents as per labeling.
   - [FILTER_REQ]: e.g., "Administer through a 0.2-micron in-line filter" or "No special in-line filter requirement specified in labeling."

3. Present your extraction reasoning and final values inside <clinical_analysis> tags as shown:

<clinical_analysis>
- DRUG_NAME: [Insert exact product name as per labeling for <drug_name>]
- Source references: Identify FDA/DailyMed references used (drug label name, section headers)
- [VIAL_STORAGE_TEMP]: [...]
- [VIAL_BUD]: [...]
- [BAG_BUD_ROOM_TEMP]: [...]
- [BAG_BUD_FRIDGE]: [...]
- [VISUAL_APPEARANCE]: [...]
- [RECON_FLUID_VOL]: [...]
- [AGITATION_METHOD]: [...]
- [DILUENT_FLUID]: [...]
- [FILTER_REQ]: [...]
- Notes: Briefly justify any "N/A" values or uncertainties with explicit mention that the information is not stated in official labeling.
</clinical_analysis>

PHASE 2: IMAGE PROMPT GENERATION
Once ALL variables are populated in <clinical_analysis>, generate a single, cohesive text-to-image prompt that an image-generation model can use to create a professional medical infographic. This prompt must be wrapped in <image_prompt> tags and must follow EXACTLY the panel, wording, and structural specifications below, with the bracketed variables injected verbatim.

The template you must populate is:

<image_prompt>
A highly detailed, professional medical infographic titled "[DRUG NAME] ADMINISTRATION GUIDE: RECONSTITUTION AND HANDLING".

Visual Style:
Clean vector illustration style, modern healthcare aesthetic, flat design with subtle gradients. Professional typography. Color palette consists of dark teal, light blue, soft green, and white. Include subtle background elements like medical crosses and molecular structures. The layout is vertical, divided into four main horizontal rounded rectangular panels.

Panel 1: BEYOND-USE DATES (BUD) & STABILITY TIMES
Split into two columns.
- Left column text: "RECONSTITUTED VIAL". Include icons of a refrigerator, a vial, and a syringe. Add bullet points: "Store at [VIAL_STORAGE_TEMP]" and "Use within [VIAL_BUD]".
- Right column text: "DILUTED INFUSION BAG". Include icons of an IV fluid bag and clocks. Add bullet points: "ROOM TEMP: Complete infusion within [BAG_BUD_ROOM_TEMP]" and "REFRIGERATED: Up to [BAG_BUD_FRIDGE]".

Panel 2: STORAGE TEMPERATURE
Split into two columns.
- Left side text: "RECONSTITUTED SOLUTION" with a large "[VIAL_STORAGE_TEMP]". Include illustrations of a medical refrigerator and a vial.
- Right side text: "[VIAL_STORAGE_TEMP]". Include an IV bag, a thermometer, and a snowflake icon if "DO NOT FREEZE" is applicable.

Panel 3: VISUAL INSPECTION GUIDELINES
Split into two columns.
- Left side: Illustration of a blue-gloved hand holding a magnifying glass inspecting a vial. Text: "SOLUTION CHARACTERISTICS", "[VISUAL_APPEARANCE]".
- Right side: Illustration of a gloved hand holding an IV bag. Text: "PARTICULATES", "DISCARD IF PARTICLES OR CLOUDINESS OBSERVED".

Panel 4: MIXING WORKFLOW: STEP-BY-STEP
A horizontal timeline sequence of 7 numbered steps with corresponding medical icons:
1. "PREPARE" (Hands cleaning area)
2. "RECONSTITUTE: [RECON_FLUID_VOL]" (Adding fluid to vial)
3. "MIX: [AGITATION_METHOD]" (Rotating vial with arrows)
4. "EXAMINE" (Visual inspection of vial)
5. "DILUTE: Add to [DILUENT_FLUID]" (Syringe transferring to IV bag)
6. "ADMINISTER: [FILTER_REQ]" (Inverting IV bag)
7. "LABEL" (Tagged IV bag ready for patient)

Ensure all text is perfectly legible, spelled exactly as prompted, and aligned neatly.
</image_prompt>

Constraints:
1. Strict Execution Order: You MUST always complete PHASE 1 (<clinical_analysis>) before PHASE 2 (<image_prompt>). Never generate an <image_prompt> without first presenting a fully populated <clinical_analysis> block.
2. Clinical Accuracy and Source Discipline: Zero hallucination tolerance. If a specific parameter is absent or ambiguous, clearly mark the corresponding variable as "N/A" in <clinical_analysis> and state that the information is not provided in official labeling. Do not infer BUDs from general stability rules or USP defaults unless explicitly described in the product's prescribing information.
3. Variable Completeness: All 9 variables must appear in <clinical_analysis>.
4. Template Integrity: In PHASE 2, you must preserve the exact wording structure, order of panels, bullet labels, and headings as shown in the TEMPLATE STRUCTURE. Only replace the bracketed variables with the extracted values.
5. Output Formatting: Wrap the Phase 1 reasoning and variables strictly inside <clinical_analysis> ... </clinical_analysis>. Wrap the final image-generation text strictly inside <image_prompt> ... </image_prompt>. Do NOT include any other commentary outside these two tagged blocks.
`;

// Add global type for window.aistudio
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [drugName, setDrugName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [clinicalAnalysis, setClinicalAnalysis] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (imagePrompt) {
      navigator.clipboard.writeText(imagePrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugName.trim()) return;

    setIsProcessing(true);
    setError(null);
    setClinicalAnalysis(null);
    setImagePrompt(null);
    setCopied(false);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key is missing.");

      const ai = new GoogleGenAI({ apiKey });

      // Step 1: Generate Clinical Analysis and Image Prompt
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `<drug_name>${drugName}</drug_name>`,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.1, // Low temperature for factual accuracy
        }
      });

      const text = response.text || '';
      
      // Parse the response
      const analysisMatch = text.match(/<clinical_analysis>([\s\S]*?)<\/clinical_analysis>/);
      const promptMatch = text.match(/<image_prompt>([\s\S]*?)<\/image_prompt>/);

      if (!analysisMatch || !promptMatch) {
        throw new Error("Failed to extract required data from the AI response. Please try again.");
      }

      const extractedAnalysis = analysisMatch[1].trim();
      const extractedPrompt = promptMatch[1].trim();

      setClinicalAnalysis(extractedAnalysis);
      setImagePrompt(extractedPrompt);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-semibold text-xl tracking-tight text-slate-800">
              IV Infographic Architect
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
            Clinical Pharmacy Tool
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero / Input Section */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-4">
            Generate IV Handling Infographics
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Enter an intravenous drug name. Our AI will extract verified handling data from FDA labeling and generate a professional, ready-to-use medical infographic.
          </p>

          <form onSubmit={handleGenerate} className="relative max-w-xl mx-auto" suppressHydrationWarning>
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                placeholder="e.g., Vancomycin, Meropenem, Piperacillin/Tazobactam"
                className="w-full pl-12 pr-32 py-4 bg-white border-2 border-slate-200 rounded-2xl text-lg focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all shadow-sm"
                disabled={isProcessing}
                suppressHydrationWarning
              />
              <button
                type="submit"
                disabled={isProcessing || !drugName.trim()}
                className="absolute right-2 top-2 bottom-2 px-6 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                suppressHydrationWarning
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3 text-left max-w-xl mx-auto"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {(clinicalAnalysis || isProcessing) && (
            <motion.div 
              ref={resultsRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              {/* Clinical Analysis Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    <h3 className="font-semibold text-slate-800">Phase 1: Clinical Data Extraction</h3>
                    {clinicalAnalysis && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                  </div>
                  <div className="p-6">
                    {clinicalAnalysis ? (
                      <div className="prose prose-sm prose-slate max-w-none">
                        <pre className="whitespace-pre-wrap font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700">
                          {clinicalAnalysis}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-teal-500" />
                        <p>Extracting FDA labeling data...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Prompt Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-800">Phase 2: Copy-Ready Image Prompt</h3>
                    {imagePrompt && (
                      <div className="ml-auto flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-600 rounded-lg transition-colors"
                        >
                          {copied ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy Prompt
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {imagePrompt ? (
                      <div className="prose prose-sm prose-slate max-w-none">
                        <pre className="whitespace-pre-wrap font-mono text-xs bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-slate-700">
                          {imagePrompt}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        {isProcessing && !clinicalAnalysis ? (
                          <p>Waiting for clinical data...</p>
                        ) : (
                          <>
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                            <p>Structuring infographic prompt...</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
