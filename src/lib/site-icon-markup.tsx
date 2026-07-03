type SiteIconMarkupProps = {
  size: number;
};

export function SiteIconMarkup({ size }: SiteIconMarkupProps) {
  const heartSize = Math.round(size * 0.56);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff1f2",
        borderRadius: Math.round(size * 0.25),
      }}
    >
      <svg
        width={heartSize}
        height={heartSize}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M16 24c-.5 0-1-.2-1.4-.5C9.5 19.5 7 16.8 7 13.5 7 11 9 9 11.5 9c1.4 0 2.7.7 3.5 1.8.8-1.1 2.1-1.8 3.5-1.8C21 9 23 11 23 13.5c0 3.3-2.5 6-7.6 10-.4.3-.9.5-1.4.5z"
          fill="#f43f5e"
        />
      </svg>
    </div>
  );
}
