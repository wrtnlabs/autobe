"use client";

import AutoBeDemoMovie from "../demo/AutoBeDemoMovie";

export default function AutoBeLandingDemoMovie(
  props: AutoBeLandingDemoMovie.IProps,
) {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="landing-grid items-end mb-12">
          <div className="col-span-12 md:col-span-7">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
              Real examples
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 md:justify-self-end">
            <p className="text-base md:text-lg text-slate-300 leading-relaxed md:text-right">
              See what AutoBE can build with different AI models.
            </p>
          </div>
        </div>

        <AutoBeDemoMovie model={props.model} />
      </div>
    </section>
  );
}
export namespace AutoBeLandingDemoMovie {
  export interface IProps {
    model?: string;
  }
}
