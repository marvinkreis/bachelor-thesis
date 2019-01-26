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
data_sets = list(normal = c("normal-1", "normal-2", "normal-3", "normal-4", "normal-5"),
                 constraint = c("constraint-1", "constraint-2", "constraint-3"),
                 random = c("random-0250", "random-0500", "random-0750", "random-1000", "random-1250", "random-1500", "random-1750", "random-2000", "random-2500", "random-3000", "random-3500", "random-4000", "random-4500", "random-5000", "random-lite-0250"),
                 random_lite = c( "random-lite-0500", "random-lite-0750", "random-lite-1000", "random-lite-1250", "random-lite-1500", "random-lite-1750", "random-lite-2000", "random-lite-2500", "random-lite-3000", "random-lite-3500", "random-lite-4000", "random-lite-4500", "random-lite-5000"));

make_scatter_plot = function(data, name) {
    correlation = cor(data$points, data$passes);

    if (grepl("normal", name)) {
        test_name = "Test";
    } else {
        test_name = "Constraint";
    }

    print(name);
    print(data);
    print(correlation);

    scatter = ggplot(data = data, aes(x = points, y = passes, color = coverage)) +
        geom_point(size = 2) +
        geom_smooth(method = lm, se = FALSE) +
        scale_color_gradient(low = "red", high = "green", limits = c(0.0, 1.0), labels = percent) +
        labs(x = "Points (Manual Evaluation)", y = paste(test_name, "Passes"), color = "Coverage") +
        theme_light();

    label = paste("r = ", round(correlation, digits = 4));
    scatter = annotate_plot(scatter, label);

    ggsave(paste("scatter-", name, ".pdf", sep=""), plot = scatter, width = 12.5, height = 10, units = "cm");
}

main = function () {
    for (set_name in names(data_sets)) {
        avg_passes = c(0);
        avg_coverage = c(0);

        for (data_name in data_sets[[set_name]]) {
            test_results  = csvs.test_results[[data_name]];
            test_coverage = csvs.test_coverage[[data_name]];

            passes = unlist(lapply(test_results, function(x) as.vector(table(x$status)["pass"])));
            passes[is.na(passes)] = 0;

            coverage = unlist(lapply(test_coverage, function(x) 100 * x[1,"percent"]));
            coverage[is.na(coverage)] = 0;

            data = data.frame(points = csvs.keller_points.total[ids],
                              passes = passes[ids],
                              coverage = coverage[ids] / 100);

            avg_passes = avg_passes + data$passes;
            avg_coverage = avg_coverage + data$coverage;

            make_scatter_plot(data, data_name);
        }

        # If the data set had multiple items, then also make a scatter plot for the average values
        num_items = length(data_sets[[set_name]]);
        if (num_items > 1) {
            avg_passes = avg_passes / num_items;
            avg_coverage = avg_coverage / num_items;

            data = data.frame(points = csvs.keller_points.total[ids],
                              passes = avg_passes,
                              coverage = avg_coverage);

            make_scatter_plot(data, paste(set_name, "-avg", sep = ""));
        }
    }
}

main();
