﻿using Socigy.Microservices.Content.Structures.Categorization;
using Socigy.Structures.Database;
using System.Text.Json.Serialization;

namespace Socigy.Microservices.Content.Structures.Profiles
{
    public class ContentProfileInterest : IDBObject<(Guid, Guid)>
    {
        [JsonRequired, JsonPropertyName("content_profile,interest_id")]
        public (Guid, Guid) ID { get; set; }

        public int Weight { get; set; }
    }
}
