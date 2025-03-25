namespace Socigy.Microservices.Content.Requests.Content.Polls
{
    public class VoteRequest
    {
        public Guid PollId { get; set; }
        public IEnumerable<Guid>? PollOptionIds { get; set; }
    }
}
