#!/usr/bin/env Rscript

library(ggplot2);
library(scales);
library(grid);
library(gtable);

source("scripts/read-data.R");
source("scripts/annotate-plot.R");


# The names of the projects to be used in the scatter plot
ids = projects.filtered;

# The names of the data sets for which to make scatter plots for
data_sets = list("run-1");

breaks = c(1, 2, 4, 8, 16, 32, 64, 128, 256, 600);

for (set_name in data_sets) {
    data = data.frame();
    coverage_totals = c();

    coverages_per_project = csvs.coverage[[set_name]];
    for (project_name in names(coverages_per_project)) {
        # Add percent-difference column to coverages
        coverages = coverages_per_project[[project_name]];
        coverages$percent_diff[1] = coverages$percent[1];
        for (j in 2:nrow(coverages)) {
            coverages$percent_diff[j] = coverages$percent[j] - coverages$percent[j-1];
        }

        # Add project column to coverages, add coverages to data
        data = rbind(data, cbind(coverages, project = project_name));

        coverage_totals[length(coverage_totals) + 1] = coverages$percent[nrow(coverages)];
    }

    data$time = data$time / 1000; # seconds instead of milliseconds

    bar = ggplot(data = data, aes(x = project, y = percent_diff, fill = time)) +
        geom_col() +
        labs(x = "Project", y = "Coverage", fill = "Time\n(in seconds)") +
        scale_fill_gradientn(colors = c("green3", "red"), trans = "log", breaks = breaks) +
        scale_y_continuous(labels = percent) +
        theme_light() +
        theme(axis.text.x = element_text(size = 7, angle = 90, hjust = 1));

    label = paste("Average\nCoverage:\n", round(mean(coverage_totals), digits = 4), sep="");
    bar = annotate_plot(bar, label);

    ggsave(paste("coverage-bar-", set_name, ".pdf", sep=""), plot = bar, width = 20, height = 10, units = "cm");

    line = ggplot(data = data, aes(x = time, y = percent, group = project, color = project)) +
        geom_line() +
        labs(x = "Time (in seconds)", y = "Coverage", color = "Project") +
        scale_x_continuous(trans = 'log', breaks = breaks) +
        scale_y_continuous(labels = percent) +
        theme_light() +
        theme(axis.text.x = element_text(angle = 90, hjust = 1), legend.key.size = unit(0.9, 'lines'));

    label = paste("Average Coverage: ", round(mean(coverage_totals), digits = 4), sep="");
    line = annotate_plot(line, label);

    ggsave(paste("coverage-line-", set_name, ".pdf", sep=""), plot = line, width = 20, height = 10, units = "cm");

    print(coverage_totals);
    print(mean(coverage_totals));
}
