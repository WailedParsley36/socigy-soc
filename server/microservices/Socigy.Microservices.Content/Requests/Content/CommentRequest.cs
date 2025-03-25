namespace Socigy.Microservices.Content.Requests.Content
{
    public class CommentRequest
    {
        public Guid PostId { get; set; }

        public string? Content { get; set; }

        public Guid? ParentCommentId { get; set; }
    }
}
