import streamlit as st
import json
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from pathlib import Path
import time

# Import the Optimizer
try:
    from advanced_prompt_optimizer import PromptOptimizationLoop
except ImportError:
    PromptOptimizationLoop = None

# Page Config
st.set_page_config(
    page_title="AI Evaluator Dashboard",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for modern look
st.markdown("""
<style>
    .metric-card {
        background-color: #1e1e1e;
        border-radius: 10px;
        padding: 20px;
        color: white;
        text-align: center;
        border: 1px solid #333;
    }
    .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: #4CAF50;
    }
    .metric-label {
        font-size: 14px;
        color: #888;
    }
    .stDataFrame {
        border-radius: 10px;
        overflow: hidden;
    }
    .step-card {
        background-color: #262730;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        border-left: 5px solid #4CAF50;
    }
</style>
""", unsafe_allow_html=True)

# Tabs
tab1, tab2 = st.tabs(["📊 Evaluation Results", "🔄 Prompt Optimizer"])

# --- TAB 1: Evaluation Results ---
with tab1:
    # Load Data
    @st.cache_data
    def load_data():
        file_path = Path("eval_results.json")
        if not file_path.exists():
            return None
        with open(file_path, "r") as f:
            return json.load(f)

    data_blob = load_data()

    # Header
    st.title("🧠 AI Evaluator Quality Assessment")
    st.markdown("### Analyzing the performance of the AI Interviewer")

    if not data_blob:
        st.warning("No `eval_results.json` found. Please run evaluation first.")
    else:
        # Summary Metrics
        summary = data_blob.get("summary", {})
        results_list = data_blob.get("results", [])

        col1, col2, col3, col4 = st.columns(4)

        with col1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value">{summary.get('total_evaluated', 0)}</div>
                <div class="metric-label">Sessions Evaluated</div>
            </div>
            """, unsafe_allow_html=True)

        with col2:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value">{summary.get('avg_quality_score', 0)} / 5</div>
                <div class="metric-label">Avg Quality Score</div>
            </div>
            """, unsafe_allow_html=True)

        with col3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value">{summary.get('avg_helpfulness_score', 0)} / 5</div>
                <div class="metric-label">Avg Helpfulness</div>
            </div>
            """, unsafe_allow_html=True)

        with col4:
            diff = summary.get('avg_score_discrepancy', 0)
            color = "#ff4b4b" if diff < 0 else "#ffa500" if diff > 0 else "#4CAF50"
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-value" style="color: {color}">{diff:+.1f} pts</div>
                <div class="metric-label">Calibration Bias</div>
            </div>
            """, unsafe_allow_html=True)


        st.divider()

        # Prepare DataFrame
        df = pd.DataFrame(results_list)

        # Clean up data for plotting
        if not df.empty:
            # Convert score strings "X/Y" to floats X
            df['ai_score_val'] = df['ai_score'].apply(lambda x: float(x.split('/')[0]) if '/' in str(x) else 0)
            df['suggested_score_val'] = df['suggested'].apply(lambda x: float(x.split('/')[0]) if '/' in str(x) else 0)
            
            # Qualitative metrics
            qual_cols = ['helpful', 'specific', 'accurate', 'construct', 'fair', 'overall']
            for col in qual_cols:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        # Charts Section
        c1, c2 = st.columns([1.5, 1])

        with c1:
            st.subheader("📏 Scoring Calibration: AI vs. Judge")
            
            if not df.empty:
                # Scatter plot matching scores
                fig_calib = go.Figure()
                
                fig_calib.add_trace(go.Bar(
                    x=df['session'],
                    y=df['ai_score_val'],
                    name='AI Score',
                    marker_color='#FF8C00'
                ))
                
                fig_calib.add_trace(go.Bar(
                    x=df['session'],
                    y=df['suggested_score_val'],
                    name='Judge Suggested',
                    marker_color='#4CAF50'
                ))
                
                fig_calib.update_layout(
                    barmode='group',
                    xaxis_title="Session ID",
                    yaxis_title="Score Points",
                    legend_title="Evaluator",
                    plot_bgcolor='rgba(0,0,0,0)',
                    paper_bgcolor='rgba(0,0,0,0)',
                    font=dict(color="white")
                )
                st.plotly_chart(fig_calib, use_container_width=True)

        with c2:
            st.subheader("🎯 Average Quality Metrics")
            
            if not df.empty:
                # Radar Chart for avg metrics
                avg_metrics = df[qual_cols].mean()
                
                fig_radar = px.line_polar(
                    r=avg_metrics.values,
                    theta=['Helpfulness', 'Specificity', 'Accuracy', 'Constructiveness', 'Fairness', 'Overall'],
                    line_close=True
                )
                fig_radar.update_traces(fill='toself', line_color='#00BFFF')
                fig_radar.update_layout(
                    polar=dict(
                        radialaxis=dict(visible=True, range=[0, 5])
                    ),
                    plot_bgcolor='rgba(0,0,0,0)',
                    paper_bgcolor='rgba(0,0,0,0)',
                    font=dict(color="white")
                )
                st.plotly_chart(fig_radar, use_container_width=True)

        st.divider()

        # Detailed Table
        st.subheader("📜 Detailed Evaluation Report")
        
        col_ctrl, _ = st.columns([1, 4])
        with col_ctrl:
            show_full = st.toggle("Show Full Text", value=False)

        # Filter columns for display
        if not df.empty:
            if show_full:
                 display_cols = ['session', 'ai_score', 'suggested', 'diff', 'helpful', 'overall', 'rationale', 'improvement_suggestions']
                 rationale_col_config = st.column_config.TextColumn("Judge's Rationale", width="large")
            else:
                 display_cols = ['session', 'ai_score', 'suggested', 'diff', 'helpful', 'overall', 'rationale_preview', 'improvement_suggestions']
                 rationale_col_config = st.column_config.TextColumn("Judge's Rationale", width="medium")

            st.dataframe(
                df[display_cols],
                column_config={
                    "session": "Session ID",
                    "rationale": rationale_col_config,
                    "rationale_preview": rationale_col_config,
                    "improvement_suggestions": st.column_config.TextColumn("Feedback for AI", width="large"),
                    "diff": st.column_config.NumberColumn("Diff", format="%+d")
                },
                use_container_width=True,
                hide_index=True
            )
            st.caption("ℹ️ Tip: Select a session in the **Left Sidebar** to view the raw JSON data.")

        # Sidebar for raw JSON
        with st.sidebar:
            st.header("🔍 Inspection Tool")
            if not df.empty:
                selected_session = st.selectbox("Select Session to Inspect", df['session'].unique())
                
                if selected_session:
                    session_data = df[df['session'] == selected_session].iloc[0].to_dict()
                    st.markdown("### Raw Data")
                    st.json(session_data)
                    
                    st.markdown("---")
                    st.markdown("**Full Rationale:**")
                    st.info(session_data.get('rationale', 'N/A'))


# --- TAB 2: Prompt Optimizer ---
with tab2:
    st.title("🔄 Advanced Prompt Optimization Loop")
    st.markdown("Automated refinement of system prompts based on evaluation evidence.")
    
    if not PromptOptimizationLoop:
        st.error("Could not import `advanced_prompt_optimizer.py`. Make sure it exists.")
        st.stop()
        
    # Initialize State
    if 'optimizer' not in st.session_state:
        st.session_state.optimizer = PromptOptimizationLoop()
    if 'opt_stage' not in st.session_state:
        st.session_state.opt_stage = 0
    if 'opt_evidence' not in st.session_state:
        st.session_state.opt_evidence = None
    if 'opt_analysis' not in st.session_state:
        st.session_state.opt_analysis = None
    if 'opt_candidates' not in st.session_state:
        st.session_state.opt_candidates = None
    if 'opt_results' not in st.session_state:
        st.session_state.opt_results = None

    # --- Step 1 & 2: Evidence & Analysis ---
    st.markdown("#### 1. Analyze Current Performance")
    if st.button("🔍 Collect Evidence & Analyze Patterns", key="btn_analyze"):
        with st.spinner("Analyzing evaluation reports and identifying failure patterns..."):
            loop = st.session_state.optimizer
            st.session_state.opt_evidence = loop.stage_collect_evidence()
            st.session_state.opt_analysis = loop.stage_analyze_patterns(st.session_state.opt_evidence)
            st.session_state.opt_stage = 1
            time.sleep(0.5)

    if st.session_state.opt_stage >= 1:
        analysis = st.session_state.opt_analysis
        
        c1, c2 = st.columns(2)
        with c1:
            st.markdown(f"""
            <div class="step-card">
                <h3>Detected Bias</h3>
                <div style="font-size: 20px; font-weight: bold; color: #ffeb3b;">{analysis.get('bias_direction')}</div>
            </div>
            """, unsafe_allow_html=True)
        with c2:
            st.markdown(f"""
            <div class="step-card">
                <h3>Primary Failure Mode</h3>
                <div style="font-size: 20px; font-weight: bold; color: #ffeb3b;">{analysis.get('primary_failure_mode')}</div>
            </div>
            """, unsafe_allow_html=True)
            
    st.divider()

    # --- Step 3: Candidate Generation ---
    st.markdown("#### 2. Generator Loop")
    if st.session_state.opt_stage >= 1:
        if st.button("🧠 Generate Prompt Candidates", key="btn_gen"):
            with st.spinner("Brainstorming improved prompts with LLM..."):
                st.session_state.opt_candidates = st.session_state.optimizer.stage_generate_candidates(st.session_state.opt_analysis)
                st.session_state.opt_stage = 2
    
    if st.session_state.opt_stage >= 2:
        candidates = st.session_state.opt_candidates
        st.info(f"Generated {len(candidates)} distinct candidates.")
        
        cols = st.columns(len(candidates))
        for i, (name, text) in enumerate(candidates.items()):
            with cols[i]:
                st.markdown(f"**{name}**")
                st.text_area("Prompt Preview", text, height=150, key=f"txt_{name}")

    st.divider()

    # --- Step 4: A/B Testing ---
    st.markdown("#### 3. Simulation & Validation")
    if st.session_state.opt_stage >= 2:
        if st.button("🧪 Run A/B Test Simulation (Golden Set)", key="btn_test"):
            with st.spinner("Running candidates against Golden Set..."):
                st.session_state.opt_results = st.session_state.optimizer.stage_ab_test(st.session_state.opt_candidates)
                st.session_state.opt_stage = 3

    if st.session_state.opt_stage >= 3:
        ab_results = st.session_state.opt_results
        
        # Bar Chart
        res_df = pd.DataFrame(list(ab_results.items()), columns=["Candidate", "Score"])
        
        fig = px.bar(
            res_df, x="Candidate", y="Score", 
            color="Score", range_y=[0, 5.5],
            title="A/B Test Results (Quality Score)",
            color_continuous_scale="Viridis"
        )
        st.plotly_chart(fig, use_container_width=True)
        
        best_candidate = max(ab_results, key=ab_results.get)
        st.success(f"🏆 Winner: **{best_candidate}** with score {ab_results[best_candidate]}/5.0")

        # --- Step 5: Deploy ---
        if st.button(f"🚀 Deploy {best_candidate} to System", type="primary"):
            st.session_state.optimizer.stage_deploy(ab_results, st.session_state.opt_candidates)
            st.balloons()
            st.success(f"Optimized prompt saved to `optimized_prompt_{best_candidate}.txt`! Review before prod.")
