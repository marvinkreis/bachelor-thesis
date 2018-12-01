#!/usr/bin/env Rscript

# Makes two scatter plots for every test result set under "data/tests-results/".
# One scatter plot displays the unfiltered data, one displays the filtered data.

library(ggplot2);
library(grid)
library(gtable)

source("scripts/read-data.R");

points = csvs.keller_data.points;

for (name in names(csvs.test_results)) {
    test_results  = csvs.test_results[[name]];
    test_coverage = csvs.test_coverage[[name]];

    passes = unlist(lapply(test_results, function(x) as.vector(table(x$status)["pass"])));
    passes[is.na(passes)] = 0;

    coverage = unlist(lapply(test_coverage, function(x) 100 * x[1,"percent"]));
    coverage[is.na(coverage)] = 0;

    ids = projects.intersect;
    data = data.frame(points = points[ids],
                      passes = passes[ids],
                      coverage = coverage[ids],
                      excluded = ! projects.intersect %in% projects.filtered);

    correlation = cor(data$points[!data$excluded], data$passes[!data$excluded]);

    print(name);
    print(data);
    print(correlation);

    scatter = ggplot(data = data, aes(x = points, y = passes, color = coverage, shape = excluded)) +
        geom_point(size = 2) +
        geom_smooth(method = lm, se = FALSE, data = subset(data, !excluded)) +
        scale_color_gradient(low = "red", high = "green") +
        scale_shape_manual(values = c(19, 1)) +
        labs(x = "Points (Manual Evaluation)", y = "Test Passes", color = "Coverage", shape = "Excluded") +
        theme_light();

        label = paste("Correlation:\n", round(correlation, digits = 4), sep = "");

        # https://stackoverflow.com/questions/32506444/ggplot-function-to-add-text-just-below-legend
        g = ggplotGrob(scatter);
        leg = g$grobs[[which(g$layout$name == "guide-box")]];
        textgrob = textGrob(x = unit(5, "points"), label, gp = gpar(cex = .75), just = "left");
        width = unit(1, "grobwidth",textgrob) + unit(10, "points");
        height = unit(1, "grobheight", textgrob)+ unit(10, "points");
        labelGrob = gTree("labelGrob", children = gList(textgrob));
        pos = subset(leg$layout, grepl("guides", name), t:r)[2,];
        leg = gtable_add_rows(leg, height, pos = pos$t+1);
        leg = gtable_add_grob(leg, labelGrob, t = pos$t+2, l = pos$l);
        leg$widths[pos$l] = max(width, leg$widths[pos$l]);
        leg$heights[pos$t+1] = unit(20, "pt");
        g$grobs[[which(g$layout$name == "guide-box")]] = leg;
        g$widths[g$layout[grepl("guide-box", g$layout$name), "l"]] = max(width, sum(leg$widths));

        ggsave(paste("scatter-", name, ".pdf", sep=""), plot = g, width = 12.5, height = 10, units = "cm");
}
