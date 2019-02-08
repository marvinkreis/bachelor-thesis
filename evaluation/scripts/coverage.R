#!/usr/bin/env Rscript

library(ggplot2);
library(scales);
library(grid);
library(gtable);
library(dplyr)

source("scripts/read-data.R");
source("scripts/annotate-plot.R");


# The names of the projects to be used in the scatter plot
ids = projects.filtered;

# The names of the data sets for which to make plots for
data_sets = c(paste("random-input-", 0:9, sep = ""),
              paste("no-input-", 0:9, sep = ""));

breaks = c(1, 2, 4, 8, 16, 32, 64, 128, 256, 600);

for (set_name in data_sets) {

    # time, running, percent, total, covered, percent_diff, project
    # running, total, covered are unused
    data = data.frame();

    coverage_records_per_project = csvs.coverage[[set_name]];

    for (project_name in names(coverage_records_per_project)) {
        coverage_records = coverage_records_per_project[[project_name]];

        # Add percent-difference column to coverage_records
        coverage_records$percent_diff = coverage_records$percent - c(0, coverage_records$percent[-length(coverage_records$percent)]);

        # Add project column to coverage_records, add coverage_records to data
        data = rbind(data, cbind(coverage_records, project = project_name));
    }

    data$time = data$time / 1000;

    mean_coverage = as.data.frame(group_by(data, time) %>%
                       summarise(percent = mean(percent)));
    total_mean_coverage = mean_coverage$percent[mean_coverage$time == 600];


    bar = ggplot(data = data, aes(x = project, y = percent_diff, fill = time)) +
        geom_col() +
        labs(x = "Project", y = "Coverage", fill = "Time\n(in seconds)") +
        scale_fill_gradientn(colors = c("green3", "red"), trans = "log", breaks = breaks) +
        scale_y_continuous(labels = percent) +
        theme_light() +
        theme(axis.text.x = element_text(size = 7, angle = 90, hjust = 1));

    label = paste("Average\nCoverage:\n", round(total_mean_coverage, digits = 4), sep="");
    bar = annotate_plot(bar, label);

    ggsave(paste("coverage-bar-", set_name, ".pdf", sep=""), plot = bar, width = 20, height = 10, units = "cm");


    # Show mean in the plot
    data_mean = data.frame(time = mean_coverage$time,
                                  running = 0,
                                  percent = mean_coverage$percent,
                                  total = 0,
                                  covered = 0,
                                  percent_diff = 0,
                                  project = "mean");

    line = ggplot(data = data, aes(x = time, y = percent, group = project, color = project)) +
        geom_line() +
        geom_line(data = data_mean, color = "black", size = 1) +
        scale_size(range = c(.5,2)) +
        scale_x_continuous(trans = 'log', breaks = breaks) +
        scale_y_continuous(labels = percent) +
        labs(x = "Time (in seconds)", y = "Coverage", color = "Project") +
        theme_light() +
        theme(axis.text.x = element_text(angle = 90, hjust = 1), legend.key.size = unit(0.9, 'lines'));

    label = paste("Average Coverage: ", round(total_mean_coverage, digits = 4), sep="");
    line = annotate_plot(line, label);

    ggsave(paste("coverage-line-", set_name, ".pdf", sep=""), plot = line, width = 25, height = 10, units = "cm");

    max_index = which(data$time == max(data$time));
    print(set_name);
    print(data$percent[max_index]);
    print(mean(data$percent[max_index]));
}
