// Copyright (c) Kiwi.com. All rights reserved.
// Licensed under the MIT License. See LICENSE in project root for details.

using Microsoft.Extensions.Hosting;
using WeekendFlights.Crawler.Services;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddHostedService<KiwiWorker>();

builder.Services.AddHttpClient<IKiwiApiClient, KiwiApiClient>(client =>
{
    client.BaseAddress = new Uri("https://api.tequila.kiwi.com/v2");
});

// Configuration binding
builder.Configuration.Build().Bind(builder.Environment);

var host = builder.Build();
host.Run();