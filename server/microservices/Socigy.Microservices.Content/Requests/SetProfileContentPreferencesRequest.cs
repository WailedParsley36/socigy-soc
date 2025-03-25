using Socigy.Services.Communication;
using Socigy.Services.Database;

namespace Socigy.Microservices.Content.Requests
{
    public class SetProfileContentPreferencesRequest : IRequest
    {
        public IEnumerable<ContentPreference> Preferences { get; set; }

        public async Task<bool> IsValid(IDatabaseService database, object? additional = null)
        {
            return Preferences.All(x => x.Weight > 0 && x.Weight <= 1000);
        }

        public class ContentPreference
        {
            /// <summary>
            /// CategoryId or InterestId
            /// </summary>
            public Guid ContentId { get; set; }
            public int Weight { get; set; }
        }
    }
}
