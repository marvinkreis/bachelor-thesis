#!/usr/bin/env Rscript

# Makes two scatter plots for every test result set under "data/tests-results/".
# One scatter plot displays the unfiltered data, one displays the filtered data.

library(ggplot2);
source("scripts/read-data.R");

points = csvs.keller_data.points;

for (name in names(csvs.test_results)) {
    name = "random-5"
    test_results  = csvs.test_results[[name]];
    test_coverage = csvs.test_coverage[[name]];

    passes = unlist(lapply(test_results, function(x) as.vector(table(x$status)["pass"])));
    passes[is.na(passes)] = 0;

    coverage = unlist(lapply(test_coverage, function(x) 100 * x[1,"percent"]));
    coverage[is.na(coverage)] = 0;

    for (do_filter in FALSE:TRUE) {
        if (do_filter) {
            filter = "unfiltered";
            ids = projects.intersect;
        } else {
            filter = "filtered";
            ids = projects.filtered;
        }

        data = data.frame(points = points[ids], passes = passes[ids], coverage = coverage[ids]);
        scatter = ggplot(data = data, aes(x = points, y = passes, color = coverage)) +
            geom_point(size = 2) +
            geom_smooth(method = lm, se = FALSE) +
            scale_color_gradient(low = "red", high = "green") +
            theme_light() +
            labs(x = "Points", y = "Test Passes", color = "Coverage");
        ggsave(paste("scatter-", name, "-", filter, ".pdf", sep=""), plot = scatter, width = 12.5, height = 10, units = "cm");
    }
}
