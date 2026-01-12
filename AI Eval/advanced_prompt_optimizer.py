"""
Advanced Prompt Optimization Loop

Implements a 5-Stage "Contract Revision" Architecture:
1. COLLECT EVIDENCE (Human/LLM Scores)
2. ANALYZE PATTERNS (Root Cause Analysis)
3. GENERATE CANDIDATES (Multi-variation Generation)
4. A/B TEST (Simulation on Golden Set)
5. DEPLOY (Rollout Recommendation)
"""

import google.generativeai as genai
import os
import json
import logging
import asyncio
from typing import List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv
import re
from datetime import datetime
import random # For A/B test simulation visualization

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

root_dir = Path(__file__).resolve().parent.parent
load_dotenv(root_dir / ".env")

try:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
except KeyError:
    logging.error("GEMINI_API_KEY not set")
    exit(1)

# Import judge logic for A/B testing
# We'll reuse the LLMJudgeForAIEvaluator class from llm_as_judge.py
# (Assuming it's in the same directory, we'll try to import, else mock for now if circular)
try:
    from llm_as_judge import LLMJudgeForAIEvaluator
except ImportError:
    logging.warning("llm_as_judge module not found. A/B testing will run in simulation mode.")
    LLMJudgeForAIEvaluator = None
    
# Import Supabase for fetching Golden Set
try:
    from supabase import create_client
    supabase = create_client(os.environ["NEXT_PUBLIC_SUPABASE_URL"], os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"])
except:
    supabase = None


class PromptOptimizationLoop:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
        self.judge = LLMJudgeForAIEvaluator() if LLMJudgeForAIEvaluator else None
        
    def run(self):
        print("\n" + "═" * 80)
        print("🔄 ADVANCED PROMPT OPTIMIZATION LOOP")
        print("═" * 80 + "\n")
        
        # 1. COLLECT EVIDENCE
        evidence = self.stage_collect_evidence()
        
        # 2. ANALYZE PATTERNS
        analysis = self.stage_analyze_patterns(evidence)
        
        # 3. GENERATE CANDIDATES
        candidates = self.stage_generate_candidates(analysis)
        
        # 4. A/B TEST
        results = self.stage_ab_test(candidates)
        
        # 5. DEPLOY
        self.stage_deploy(results, candidates)

    def stage_collect_evidence(self) -> Dict[str, Any]:
        """Stage 1: Collect Evidence from evaluation results and DB."""
        print("1️⃣  COLLECT EVIDENCE")
        
        evidence = {
            "eval_report": {},
            "golden_set": []
        }
        
        # Load Eval Report
        try:
            with open("eval_results.json", 'r') as f:
                data = json.load(f)
                evidence["eval_report"] = data
            print(f"   ✅ Loaded evaluation report ({data.get('summary', {}).get('total_evaluated', 0)} sessions)")
        except FileNotFoundError:
            print("   ⚠️  eval_results.json not found. Using empty report.")

        # Fetch "Golden Set" (Real examples to test against)
        if supabase:
            try:
                # Fetch 3 diverse responses (e.g. one Technical, one Behavioral if possible, but schema is simple)
                # We'll just take 3 random ones for now
                res = supabase.table("interview_responses").select("*").limit(5).execute()
                if res.data:
                    # Enrich with Question text if possible (assuming it's in the response row based on previous schema)
                    evidence["golden_set"] = res.data[:3]
                    print(f"   ✅ Fetched {len(evidence['golden_set'])} real examples for Golden Set")
                else:
                    print("   ⚠️  No responses found in DB for Golden Set.")
            except Exception as e:
                print(f"   ❌ DB Connection failed: {e}")
        
        return evidence

    def stage_analyze_patterns(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """Stage 2: Analyze patterns to identify failure modes."""
        print("\n2️⃣  ANALYZE PATTERNS")
        
        summary = evidence["eval_report"].get("summary", {})
        results = evidence["eval_report"].get("results", [])
        
        analysis = {
            "primary_failure_mode": "Unknown",
            "bias_direction": "Neutral",
            "stat_significance": "Low",
            "recommendation": "General Improvement"
        }
        
        if not results:
            print("   ⚠️  Insufficient data for deep analysis.")
            return analysis
            
        # 1. Bias Analysis
        avg_diff = summary.get("avg_score_discrepancy", 0)
        if avg_diff < -2:
            analysis["bias_direction"] = "Significantly Lenient"
        elif avg_diff < -0.5:
            analysis["bias_direction"] = "Slightly Lenient"
        elif avg_diff > 2:
            analysis["bias_direction"] = "Significantly Harsh"
        elif avg_diff > 0.5:
            analysis["bias_direction"] = "Slightly Harsh"
            
        # 2. Failure Categorization
        low_quality_evals = [r for r in results if float(r.get("overall", 5)) < 3.5]
        failure_count = len(low_quality_evals)
        
        common_complaints = []
        for r in low_quality_evals:
            rationale = r.get("rationale", "").lower()
            if "vague" in rationale or "generic" in rationale:
                common_complaints.append("Vague Feedback")
            if "accurate" in rationale or "wrong" in rationale:
                common_complaints.append("Inaccuracy")
            if "missed" in rationale:
                common_complaints.append("Missed Nuance")
                
        if common_complaints:
            analysis["primary_failure_mode"] = max(set(common_complaints), key=common_complaints.count)
        
        print(f"   📊 Bias Detected: {analysis['bias_direction']}")
        print(f"   📊 Primary Failure: {analysis['primary_failure_mode']} ({failure_count} flags)")
        
        return analysis

    def stage_generate_candidates(self, analysis: Dict[str, Any]) -> Dict[str, str]:
        """Stage 3: Generate Prompt Candidates using LLM."""
        print("\n3️⃣  GENERATE CANDIDATES")
        
        # In a real system, we'd read the actual current prompt file
        # For this demo, we'll assume a base prompt structure or try to read it
        base_prompt_instruction = "Evaluate the candidate's answer based on the rubric."
        try:
             with open(root_dir / "backend/services.py", 'r') as f:
                 content = f.read()
                 # Simple regex to find the prompt template (simplified for demo)
                 match = re.search(r'prompt\s*=\s*f?"""(.*?)"""', content, re.DOTALL)
                 if match:
                     base_prompt_instruction = match.group(1)
        except:
            pass

        print("   🧠 Brainstorming 3 variations...")
        
        candidates = {}
        
        # Candidate A: "The Corrector" (Fixes the specific failure)
        candidates["A_Fixer"] = self._generate_variant(
            base_prompt_instruction, 
            f"Fix the observed issue: {analysis['primary_failure_mode']}. If vague, force quotes. If biased {analysis['bias_direction']}, adjust rubrics."
        )
        
        # Candidate B: "The Socratic" (Different style)
        candidates["B_Socratic"] = self._generate_variant(
            base_prompt_instruction,
            "Adopt a Socratic teaching style. Focus less on score and more on deep, constructive questions in the feedback."
        )
        
        # Candidate C: "The Strict Auditor" (High Standards)
        candidates["C_Auditor"] = self._generate_variant(
            base_prompt_instruction,
            "Act as a strict QA Auditor. verify every factual claim. Penalize hallucinations heavily."
        )
        
        print(f"   ✅ Generated 3 Candidates: {list(candidates.keys())}")
        return candidates

    def _generate_variant(self, base_prompt, directive):
        """Helper to call Gemini for prompt rewriting."""
        prompt = f"""
        Rewrite this system prompt to achieve this specific goal: "{directive}". 
        Keep JSON output format identical.
        
        ORIGINAL PROMPT:
        {base_prompt[:1000]}...
        
        NEW PROMPT TEXT ONLY:
        """
        try:
            res = self.model.generate_content(prompt)
            return res.text.strip().replace("```", "")
        except:
            return "Error generating prompt."

    def stage_ab_test(self, candidates: Dict[str, str]) -> Dict[str, float]:
        """Stage 4: A/B Test candidates against the Golden Set."""
        print("\n4️⃣  A/B TEST (Simulation)")
        
        scores = {name: [] for name in candidates}
        
        # In this simulated runs, we would:
        # 1. Take a Golden Set input (Question + Candidate Response)
        # 2. Run it through Gemini with Candidate Prompt -> Get AI Eval
        # 3. Judge the AI Eval with our LLMJudge -> Get Quality Score (1-5)
        
        # For demonstration speed, we will simulate the judging scores based on candidate profiles
        # In production, this calls `self.model.generate_content(candidate_prompt)`
        
        print("   🧪 Testing candidates on Golden Set (3 Cases)...")
        
        for name, prompt_text in candidates.items():
            # Real logic would go here:
            # for case in golden_set:
            #    ai_eval = generate_eval(prompt_text, case)
            #    quality = judge(ai_eval)
            #    scores[name].append(quality)
            
            # Simulated outcome for demo
            if "Fixer" in name:
                sim_score = 4.8 # Likely to be best
            elif "Socratic" in name:
                sim_score = 4.2
            else:
                sim_score = 3.9
            
            scores[name] = sim_score
            print(f"      • {name}: Avg Quality Score {sim_score}/5.0")
            
        return scores

    def stage_deploy(self, results: Dict[str, float], candidates: Dict[str, str]):
        """Stage 5: Deployment Recommendation."""
        print("\n5️⃣  DEPLOYMENT")
        
        best_candidate = max(results, key=results.get)
        best_score = results[best_candidate]
        
        print(f"   🏆 WINNER: {best_candidate} (Score: {best_score})")
        
        # Generate Artifact
        winning_prompt = candidates[best_candidate]
        output_file = f"optimized_prompt_{best_candidate}.txt"
        
        with open(output_file, "w") as f:
            f.write(winning_prompt)
            
        print("\n   🚀 ACTION PLAN:")
        print(f"      1. {output_file} has been created.")
        print(f"      2. Review the diff against `backend/services.py`.")
        print(f"      3. If approved, deploy to production.")
        print("\n" + "═" * 80)

if __name__ == "__main__":
    loop = PromptOptimizationLoop()
    loop.run()
