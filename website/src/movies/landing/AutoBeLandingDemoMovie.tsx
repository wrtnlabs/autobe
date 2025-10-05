"use client";

import AutoBeDemoMovie from "../demo/AutoBeDemoMovie";

export default function AutoBeLandingDemoMovie(
  props: AutoBeLandingDemoMovie.IProps,
) {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6">Real Examples</h2>
          <p className="text-xl text-gray-300 mb-6">
            See what AutoBE can build with different AI models
          </p>
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
