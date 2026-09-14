import React from "react";
import { FiBookOpen } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSharedData } from "@/contexts/SharedDataContext";

export const CurriculumSection: React.FC = () => {
  const { t } = useLanguage();
  const { classSubjects } = useSharedData();
  const subjects = classSubjects.filter(
    (subject, index, all) =>
      all.findIndex((item) => item.name === subject.name) === index,
  );

  return (
    <section id="curriculum" className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t.curriculumTitle.split(" ")[0]}{" "}
            <span className="text-gradient-primary">
              {t.curriculumTitle.split(" ").slice(1).join(" ")}
            </span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            {t.curriculumSubtitle}
          </p>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
          {subjects.map((subject) => (
            <div
              key={subject.name}
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-soft transition-all text-center group"
            >
              <FiBookOpen className="w-7 h-7 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-foreground text-sm mb-1">
                {subject.name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {subject.nameArabic}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
